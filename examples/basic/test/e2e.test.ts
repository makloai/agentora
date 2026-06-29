import { createClient } from '@agentora/client';
import { doctor } from '@agentora/doctor';
import { listTools } from '@agentora/mcp';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import type { contracts } from '../src/contracts/products';
import { fetchHandler, openaiTools, tools } from '../src/surfaces';

// Route the typed client straight at the in-process fetch handler.
const client = createClient<typeof contracts>({
  url: 'http://app.local',
  headers: { 'x-scopes': 'orders:write' },
  fetch: (input, init) => fetchHandler(new Request(input as string, init)),
});

describe('end-to-end across surfaces', () => {
  it('runs a read action through the HTTP handler + typed client', async () => {
    const out = await client.products.search({ query: 'shoes' });
    expect(out.results.map((r) => r.id)).toEqual(['p1', 'p2']);
  });

  it('runs a write action (auth + idempotency) and replays on retry', async () => {
    const first = await client.orders.create({ productId: 'p1', quantity: 2 });
    const second = await client.orders.create({ productId: 'p1', quantity: 2 });
    expect(first.orderId).toBe(second.orderId); // idempotent replay
  });

  it('rejects a write without the required scope', async () => {
    const noScope = createClient<typeof contracts>({
      url: 'http://app.local',
      fetch: (input, init) => fetchHandler(new Request(input as string, init)),
    });
    await expect(noScope.orders.create({ productId: 'p1', quantity: 1 })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('exposes the same actions as MCP tools and AI SDK tools', () => {
    expect(
      listTools(app)
        .map((t) => t.name)
        .sort()
    ).toEqual(['orders.create', 'products.search']);
    expect(Object.keys(tools).sort()).toEqual(['orders.create', 'products.search']);
  });

  it('emits strict OpenAI tool specs', () => {
    expect(openaiTools).toHaveLength(2);
  });

  it('scores well on the doctor (fully-annotated contracts)', () => {
    const report = doctor(app.manifest());
    expect(report.score).toBe(100);
    expect(report.findings).toEqual([]);
  });
});
