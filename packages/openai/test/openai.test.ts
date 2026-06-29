import { defineContract, s } from '@agentora/core';
import { createApp, implement, router } from '@agentora/server';
import { describe, expect, it } from 'vitest';
import { openaiChatTools, openaiResponsesTools } from '../src/index';

const search = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  sideEffects: 'read',
  input: s.object({ query: s.string().min(1), limit: s.number().default(10) }),
  output: s.object({ ids: s.array(s.string()) }),
});

const app = createApp({
  router: router({ products: { search: implement(search, async () => ({ ids: [] })) } }),
});

describe('openaiChatTools', () => {
  it('nests parameters under function with strict:true', () => {
    const [tool] = openaiChatTools(app) as Array<{
      type: string;
      function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
        strict: boolean;
      };
    }>;
    expect(tool?.type).toBe('function');
    expect(tool?.function.name).toBe('products.search');
    expect(tool?.function.description).toBe('Search the catalog');
    expect(tool?.function.strict).toBe(true);
  });

  it('emits the strict schema variant', () => {
    const [tool] = openaiChatTools(app) as Array<{
      function: { parameters: Record<string, unknown> };
    }>;
    const params = tool?.function.parameters as {
      additionalProperties: boolean;
      required: string[];
      properties: Record<string, { type: unknown }>;
    };
    expect(params.additionalProperties).toBe(false);
    // both fields required under strict; defaulted `limit` becomes nullable
    expect(params.required.sort()).toEqual(['limit', 'query']);
    expect(params.properties.limit?.type).toEqual(['number', 'null']);
  });
});

describe('openaiResponsesTools', () => {
  it('flattens the spec (no function wrapper) with identical parameters', () => {
    const [chat] = openaiChatTools(app) as Array<{ function: { parameters: unknown } }>;
    const [resp] = openaiResponsesTools(app) as Array<{
      type: string;
      name: string;
      parameters: unknown;
      strict: boolean;
    }>;
    expect(resp?.type).toBe('function');
    expect(resp?.name).toBe('products.search');
    expect(resp?.strict).toBe(true);
    // parameters byte-identical between the two shapes
    expect(resp?.parameters).toEqual(chat?.function.parameters);
  });
});
