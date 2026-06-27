import { defineContract, s } from '@agentora/core';
import { createApp, implement, router } from '@agentora/server';
import { describe, expect, it, vi } from 'vitest';
import { aiSdkTools } from '../src/index';

const search = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ ids: s.array(s.string()) }),
});

function appWith(impl = async () => ({ ids: ['a'] })) {
  return createApp({
    router: router({ products: { search: implement(search, impl) } }),
  });
}

// The AI SDK passes a rich options object to execute; tests only need abortSignal.
const execOptions = { toolCallId: 't1', messages: [] } as never;

describe('aiSdkTools', () => {
  it('produces one tool per action keyed by dotted name', () => {
    const tools = aiSdkTools(appWith());
    expect(Object.keys(tools)).toEqual(['products.search']);
    expect(tools['products.search']?.description).toBe('Search the catalog');
    expect(tools['products.search']?.inputSchema).toBeDefined();
  });

  it('wraps the strict JSON Schema variant', () => {
    const tools = aiSdkTools(appWith());
    // jsonSchema() stores the schema on `.jsonSchema`
    const wrapped = tools['products.search']?.inputSchema as {
      jsonSchema?: Record<string, unknown>;
    };
    const schema = wrapped.jsonSchema as { additionalProperties: boolean; required: string[] };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required.sort()).toEqual(['limit', 'query']);
  });

  it('execute invokes the app and returns handler output', async () => {
    const impl = vi.fn(async () => ({ ids: ['x'] }));
    const tools = aiSdkTools(appWith(impl));
    const execute = tools['products.search']?.execute as (
      input: unknown,
      options: never
    ) => Promise<unknown>;
    const out = await execute({ query: 'shoes' }, execOptions);
    expect(out).toEqual({ ids: ['x'] });
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it('forwards the abortSignal to the runtime', async () => {
    const controller = new AbortController();
    const impl = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      controller.abort();
      if (signal.aborted) {
        throw new Error('stop');
      }
      return { ids: [] };
    });
    const tools = aiSdkTools(appWith(impl));
    const execute = tools['products.search']?.execute as (
      input: unknown,
      options: { toolCallId: string; messages: never[]; abortSignal: AbortSignal }
    ) => Promise<unknown>;
    await expect(
      execute({ query: 'q' }, { toolCallId: 't', messages: [], abortSignal: controller.signal })
    ).rejects.toMatchObject({ code: 'CANCELLED' });
  });
});
