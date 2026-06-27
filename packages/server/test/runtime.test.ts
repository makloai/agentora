import { AgentoraError, defineContract, s } from '@agentora/core';
import { describe, expect, it, vi } from 'vitest';
import { type Middleware, createApp, implement, router } from '../src/index';

const search = defineContract({
  name: 'products.search',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ ids: s.array(s.string()) }),
});

function appWith(handler = async () => ({ ids: ['a'] }), use: Middleware[] = []) {
  return createApp({
    router: router({ products: { search: implement(search, handler) } }),
    use,
  });
}

describe('App.resolve', () => {
  it('resolves a dotted action name to its implementation', () => {
    expect(appWith().resolve('products.search')?.contract.name).toBe('products.search');
  });

  it('returns undefined for an unknown action', () => {
    expect(appWith().resolve('nope')).toBeUndefined();
  });
});

describe('invoke pipeline', () => {
  it('passes validated input to the handler and returns its output', async () => {
    const handler = vi.fn(async () => ({ ids: ['x', 'y'] }));
    const app = appWith(handler);
    const out = await app.invoke('products.search', { query: 'shoes' });
    expect(out).toEqual({ ids: ['x', 'y'] });
    // default applied: limit defaulted to 10
    expect(handler.mock.calls[0]?.[0].input).toEqual({ query: 'shoes', limit: 10 });
  });

  it('rejects invalid input with VALIDATION and never calls the handler', async () => {
    const handler = vi.fn(async () => ({ ids: [] }));
    const app = appWith(handler);
    await expect(app.invoke('products.search', { query: 123 })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND for an unknown action', async () => {
    await expect(appWith().invoke('ghost', {})).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('runs middleware in declared order, wrapping the handler', async () => {
    const order: string[] = [];
    const mw =
      (tag: string): Middleware =>
      async (_args, next) => {
        order.push(`>${tag}`);
        const r = await next();
        order.push(`<${tag}`);
        return r;
      };
    const handler = async () => {
      order.push('handler');
      return { ids: [] };
    };
    await appWith(handler, [mw('a'), mw('b')]).invoke('products.search', { query: 'q' });
    expect(order).toEqual(['>a', '>b', 'handler', '<b', '<a']);
  });

  it('lets a middleware short-circuit before the handler', async () => {
    const handler = vi.fn(async () => ({ ids: [] }));
    const block: Middleware = async () => ({ ids: ['blocked'] });
    const out = await appWith(handler, [block]).invoke('products.search', { query: 'q' });
    expect(out).toEqual({ ids: ['blocked'] });
    expect(handler).not.toHaveBeenCalled();
  });

  it('maps a thrown plain error to INTERNAL', async () => {
    const app = appWith(async () => {
      throw new Error('boom');
    });
    await expect(app.invoke('products.search', { query: 'q' })).rejects.toMatchObject({
      code: 'INTERNAL',
      message: 'boom',
    });
  });

  it('preserves an AgentoraError thrown by the handler', async () => {
    const app = appWith(async () => {
      throw new AgentoraError('FORBIDDEN', 'nope');
    });
    await expect(app.invoke('products.search', { query: 'q' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('fails output that does not match the output schema', async () => {
    // handler returns a wrong shape
    const app = appWith(async () => ({ ids: [123] }) as unknown as { ids: string[] });
    await expect(app.invoke('products.search', { query: 'q' })).rejects.toMatchObject({
      code: 'INTERNAL',
    });
  });

  it('surfaces cancellation as CANCELLED when the signal aborts', async () => {
    const controller = new AbortController();
    const app = appWith(async ({ signal }) => {
      controller.abort();
      if (signal.aborted) {
        throw new Error('stop');
      }
      return { ids: [] };
    });
    await expect(
      app.invoke('products.search', { query: 'q' }, { signal: controller.signal })
    ).rejects.toMatchObject({ code: 'CANCELLED' });
  });

  it('delivers stream events to the supplied sink', async () => {
    const log = vi.fn();
    const progress = vi.fn();
    const app = appWith(async ({ stream }) => {
      stream.log('searching');
      stream.progress(0.5);
      return { ids: [] };
    });
    await app.invoke('products.search', { query: 'q' }, { stream: { log, progress } });
    expect(log).toHaveBeenCalledWith('searching');
    expect(progress).toHaveBeenCalledWith(0.5);
  });
});
