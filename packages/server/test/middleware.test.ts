import { AgentoraError, defineContract, s } from '@agentora/core';
import { describe, expect, it, vi } from 'vitest';
import { type Middleware, createApp, implement, router } from '../src/index';
import {
  type TraceEvent,
  auth,
  concurrency,
  idempotency,
  memoryStore,
  redact,
  retry,
  trace,
} from '../src/middleware';

const writeContract = defineContract({
  name: 'orders.create',
  sideEffects: 'write',
  input: s.object({ sku: s.string() }),
  output: s.object({ id: s.string() }),
});

const readContract = defineContract({
  name: 'orders.list',
  sideEffects: 'read',
  input: s.object({}),
  output: s.object({ ids: s.array(s.string()) }),
});

function app(opts: {
  contract?: typeof writeContract | typeof readContract;
  handler?: (args: { input: unknown; ctx: unknown; stream: unknown }) => Promise<unknown>;
  use?: Middleware[];
  context?: (req: Request) => unknown;
}) {
  const contract = opts.contract ?? writeContract;
  const handler = opts.handler ?? (async () => ({ id: '1' }));
  return createApp({
    router: router({ [contract.name]: implement(contract, handler as never) }),
    context: opts.context,
    use: opts.use ?? [],
  });
}

describe('auth', () => {
  it('rejects an unauthenticated write with UNAUTHENTICATED', async () => {
    const a = app({ use: [auth()], context: () => ({ user: null }) });
    await expect(a.invoke('orders.create', { sku: 'x' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a missing scope with FORBIDDEN', async () => {
    const a = app({
      use: [auth({ scopes: ['orders:write'] })],
      context: () => ({ user: { scopes: ['orders:read'] } }),
    });
    await expect(a.invoke('orders.create', { sku: 'x' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('passes through when authenticated with the right scope', async () => {
    const a = app({
      use: [auth({ scopes: ['orders:write'] })],
      context: () => ({ user: { scopes: ['orders:write'] } }),
    });
    await expect(a.invoke('orders.create', { sku: 'x' })).resolves.toEqual({ id: '1' });
  });
});

describe('idempotency', () => {
  it('replays the first result for the same key without re-running the handler', async () => {
    const handler = vi.fn(async () => ({ id: Math.random().toString() }));
    const store = memoryStore();
    const a = app({ handler, use: [idempotency({ store })] });
    const first = await a.invoke('orders.create', { sku: 'x' });
    const second = await a.invoke('orders.create', { sku: 'x' });
    expect(second).toEqual(first);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('re-runs for a different input key', async () => {
    const handler = vi.fn(async () => ({ id: '1' }));
    const a = app({ handler, use: [idempotency()] });
    await a.invoke('orders.create', { sku: 'x' });
    await a.invoke('orders.create', { sku: 'y' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not dedupe read actions', async () => {
    const handler = vi.fn(async () => ({ ids: [] }));
    const a = app({ contract: readContract, handler, use: [idempotency()] });
    await a.invoke('orders.list', {});
    await a.invoke('orders.list', {});
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('concurrency', () => {
  it('serializes calls beyond the limit', async () => {
    let active = 0;
    let maxActive = 0;
    const handler = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { id: '1' };
    };
    const a = app({ handler, use: [concurrency(1)] });
    await Promise.all([
      a.invoke('orders.create', { sku: 'a' }),
      a.invoke('orders.create', { sku: 'b' }),
      a.invoke('orders.create', { sku: 'c' }),
    ]);
    expect(maxActive).toBe(1);
  });

  it('releases the slot after an error', async () => {
    let calls = 0;
    const handler = async () => {
      calls++;
      if (calls === 1) {
        throw new Error('first fails');
      }
      return { id: '1' };
    };
    const a = app({ handler, use: [concurrency(1)] });
    await expect(a.invoke('orders.create', { sku: 'a' })).rejects.toBeTruthy();
    await expect(a.invoke('orders.create', { sku: 'b' })).resolves.toEqual({ id: '1' });
  });
});

describe('retry', () => {
  it('retries a retryable failure then succeeds', async () => {
    let calls = 0;
    const handler = async () => {
      calls++;
      if (calls < 3) {
        throw new AgentoraError('INTERNAL', 'transient');
      }
      return { ids: [] };
    };
    const a = app({ contract: readContract, handler, use: [retry(3, { baseMs: 0 })] });
    await expect(a.invoke('orders.list', {})).resolves.toEqual({ ids: [] });
    expect(calls).toBe(3);
  });

  it('does not retry a non-retryable error', async () => {
    let calls = 0;
    const handler = async () => {
      calls++;
      throw new AgentoraError('FORBIDDEN', 'no');
    };
    const a = app({ contract: readContract, handler, use: [retry(3, { baseMs: 0 })] });
    await expect(a.invoke('orders.list', {})).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(calls).toBe(1);
  });
});

describe('redact', () => {
  it('scrubs configured keys from stream.log data', async () => {
    const log = vi.fn();
    const handler = async ({ stream }: { stream: { log: (m: string, d?: unknown) => void } }) => {
      stream.log('auth attempt', { user: 'ada', password: 'hunter2' });
      return { id: '1' };
    };
    const a = app({ handler, use: [redact()] });
    await a.invoke('orders.create', { sku: 'x' }, { stream: { log } });
    expect(log).toHaveBeenCalledWith('auth attempt', { user: 'ada', password: '[REDACTED]' });
  });
});

describe('trace', () => {
  it('emits start and end around success and failure', async () => {
    const events: TraceEvent[] = [];
    const onEvent = (e: TraceEvent) => events.push(e);

    const ok = app({ handler: async () => ({ id: '1' }), use: [trace({ onEvent })] });
    await ok.invoke('orders.create', { sku: 'x' });
    expect(events.map((e) => e.phase)).toEqual(['start', 'end']);
    expect(events[1]?.ok).toBe(true);

    events.length = 0;
    const bad = app({
      handler: async () => {
        throw new Error('boom');
      },
      use: [trace({ onEvent })],
    });
    await expect(bad.invoke('orders.create', { sku: 'x' })).rejects.toBeTruthy();
    expect(events[1]?.ok).toBe(false);
  });
});

describe('memoryStore', () => {
  it('isolates keys with get/set/has', async () => {
    const store = memoryStore<number>();
    expect(await store.has('a')).toBe(false);
    await store.set('a', 1);
    expect(await store.get('a')).toBe(1);
    expect(await store.has('b')).toBe(false);
  });
});
