import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AgentoraError, defineContract, s } from '@agentora/core';
import { describe, expect, it, vi } from 'vitest';
import { type ClientOptions, createClient } from '../src/index';

const contracts = {
  products: {
    search: defineContract({
      name: 'products.search',
      input: s.object({ query: s.string() }),
      output: s.object({ ids: s.array(s.string()) }),
    }),
  },
};

function clientWith(fetchImpl: ClientOptions['fetch'], headers?: ClientOptions['headers']) {
  return createClient<typeof contracts>({ url: '/api', fetch: fetchImpl, headers });
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createClient', () => {
  it('POSTs to the dotted action path with the JSON body', async () => {
    const fetchMock = vi.fn(async () => ok({ ids: ['a'] }));
    const client = clientWith(fetchMock as unknown as typeof fetch);
    const out = await client.products.search({ query: 'shoes' });
    expect(out).toEqual({ ids: ['a'] });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/products.search');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ query: 'shoes' });
  });

  it('reconstructs a typed AgentoraError from a 4xx response', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: 'FORBIDDEN', message: 'nope' }), { status: 403 })
    );
    const client = clientWith(fetchMock as unknown as typeof fetch);
    await expect(client.products.search({ query: 'x' })).rejects.toBeInstanceOf(AgentoraError);
    await expect(client.products.search({ query: 'x' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'nope',
    });
  });

  it('applies static and function headers', async () => {
    const fetchMock = vi.fn(async () => ok({ ids: [] }));
    await clientWith(fetchMock as unknown as typeof fetch, {
      authorization: 'Bearer t',
    }).products.search({
      query: 'x',
    });
    let init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer t');

    fetchMock.mockClear();
    await clientWith(fetchMock as unknown as typeof fetch, () => ({
      'x-trace': '1',
    })).products.search({
      query: 'x',
    });
    init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)['x-trace']).toBe('1');
  });

  it('imports no @agentora/server symbols (browser-safe)', () => {
    const src = fileURLToPath(new URL('../src/index.ts', import.meta.url));
    const react = fileURLToPath(new URL('../src/react.ts', import.meta.url));
    expect(readFileSync(src, 'utf8')).not.toContain('@agentora/server');
    expect(readFileSync(react, 'utf8')).not.toContain('@agentora/server');
  });
});
