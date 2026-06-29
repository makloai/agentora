import { defineContract, s } from '@agentora/core';
import { createApp, implement, router } from '@agentora/server';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';
import { callTool, createServer, listTools } from '../src/index';

const search = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  sideEffects: 'read',
  input: s.object({ query: s.string() }),
  output: s.object({ ids: s.array(s.string()) }),
});

function appWith(impl = async () => ({ ids: ['a'] })) {
  return createApp({
    router: router({ products: { search: implement(search, impl) } }),
  });
}

const names = new Set(['products.search']);

describe('listTools', () => {
  it('returns one tool per action with the compiled inputSchema', () => {
    const [tool] = listTools(appWith());
    expect(tool?.name).toBe('products.search');
    expect(tool?.description).toBe('Search the catalog');
    expect(tool?.inputSchema).toMatchObject({ type: 'object', required: ['query'] });
    expect(tool?.outputSchema).toMatchObject({ type: 'object' });
  });
});

describe('callTool', () => {
  it('returns content + structuredContent on success', async () => {
    const result = await callTool(appWith(), names, 'products.search', { query: 'shoes' });
    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toEqual({ ids: ['a'] });
    expect(result.content[0]?.text).toBe(JSON.stringify({ ids: ['a'] }));
  });

  it('returns isError:true (not a protocol error) on invalid input', async () => {
    const result = await callTool(appWith(), names, 'products.search', { query: 123 });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('validation');
  });

  it('throws a protocol McpError for an unknown tool', async () => {
    await expect(callTool(appWith(), names, 'ghost', {})).rejects.toBeInstanceOf(McpError);
  });

  it('relays progress when a progress callback is supplied', async () => {
    const progress = vi.fn();
    const app = appWith(async ({ stream }) => {
      stream.progress(0.5);
      return { ids: [] };
    });
    await callTool(app, names, 'products.search', { query: 'q' }, { progress });
    expect(progress).toHaveBeenCalledWith(0.5);
  });
});

describe('createServer', () => {
  it('constructs a low-level MCP server without throwing', () => {
    const server = createServer(appWith(), { name: 'test', version: '1.0.0' });
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });
});
