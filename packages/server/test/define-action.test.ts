import { s } from '@agentora/core';
import { describe, expect, it, vi } from 'vitest';
import { createApp, defineAction, router } from '../src/index';

describe('defineAction', () => {
  const greet = defineAction({
    name: 'greet',
    input: s.object({ name: s.string() }),
    output: s.object({ message: s.string() }),
    handler: async ({ input }) => ({ message: `hi ${input.name}` }),
  });

  it('produces an Implemented whose contract is pure and serializable', () => {
    expect('handler' in greet.contract).toBe(false);
    expect(greet.contract.name).toBe('greet');
    // contract must JSON round-trip (no functions hiding in it beyond schemas)
    const json = JSON.parse(JSON.stringify({ name: greet.contract.name }));
    expect(json).toEqual({ name: 'greet' });
  });

  it('runs through invoke like a split implement()', async () => {
    const app = createApp({ router: router({ greet }) });
    await expect(app.invoke('greet', { name: 'ada' })).resolves.toEqual({ message: 'hi ada' });
  });

  it('awaits an async context factory and passes ctx to the handler', async () => {
    const seen = vi.fn();
    const action = defineAction({
      name: 'ctx.probe',
      input: s.object({}),
      output: s.object({ ok: s.boolean() }),
      handler: async ({ ctx }) => {
        seen(ctx);
        return { ok: true };
      },
    });
    const app = createApp({
      router: router({ ctx: { probe: action } }),
      context: async () => ({ tenant: 'acme' }),
    });
    await app.invoke('ctx.probe', {});
    expect(seen).toHaveBeenCalledWith({ tenant: 'acme' });
  });
});
