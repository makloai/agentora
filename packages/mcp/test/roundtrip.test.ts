import { defineContract, s } from '@agentora/core';
import { createApp, implement, router } from '@agentora/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from '../src/index';

const search = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  sideEffects: 'read',
  input: s.object({ query: s.string() }),
  output: s.object({ ids: s.array(s.string()) }),
});

const app = createApp({
  router: router({
    products: { search: implement(search, async ({ input }) => ({ ids: [`hit:${input.query}`] })) },
  }),
});

let client: Client;

beforeEach(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer(app, { name: 'agentora-test', version: '1.0.0' });
  await server.connect(serverTransport);
  client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(clientTransport);
});

afterEach(async () => {
  await client.close();
});

describe('MCP protocol roundtrip (client <-> server)', () => {
  it('lists tools over the wire with the compiled inputSchema', async () => {
    const { tools } = await client.listTools();
    const tool = tools.find((t) => t.name === 'products.search');
    expect(tool).toBeDefined();
    expect(tool?.description).toBe('Search the catalog');
    expect(tool?.inputSchema).toMatchObject({ type: 'object', required: ['query'] });
  });

  it('calls a tool over the wire and returns content + structuredContent', async () => {
    const result = await client.callTool({
      name: 'products.search',
      arguments: { query: 'shoes' },
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({ ids: ['hit:shoes'] });
  });

  it('returns a tool-execution error (isError) on invalid input', async () => {
    const result = await client.callTool({
      name: 'products.search',
      arguments: { query: 123 },
    });
    expect(result.isError).toBe(true);
  });

  it('raises a protocol error for an unknown tool', async () => {
    await expect(client.callTool({ name: 'ghost', arguments: {} })).rejects.toBeTruthy();
  });
});
