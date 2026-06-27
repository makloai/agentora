import { AgentoraError, defineContract, s } from '@agentora/core';
import { type Middleware, createApp, implement, router } from '@agentora/server';
import { describe, expect, it } from 'vitest';
import { toFetchHandler } from '../src/index';

const search = defineContract({
  name: 'products.search',
  sideEffects: 'read',
  input: s.object({ query: s.string() }),
  output: s.object({ ids: s.array(s.string()) }),
});

function handlerFor(use: Middleware[] = [], impl = async () => ({ ids: ['a'] })) {
  const app = createApp({
    router: router({ products: { search: implement(search, impl) } }),
    use,
  });
  return toFetchHandler(app);
}

const post = (name: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://x/${name}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });

describe('toFetchHandler', () => {
  it('POSTs a valid action and returns 200 + output', async () => {
    const res = await handlerFor()(post('products.search', { query: 'shoes' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ids: ['a'] });
  });

  it('returns 404 for an unknown action', async () => {
    const res = await handlerFor()(post('ghost', {}));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('NOT_FOUND');
  });

  it('returns 400 on invalid input', async () => {
    const res = await handlerFor()(post('products.search', { query: 123 }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('VALIDATION');
  });

  it('maps each AgentoraError code to its HTTP status', async () => {
    const codes = [
      ['UNAUTHENTICATED', 401],
      ['FORBIDDEN', 403],
      ['CONFLICT', 409],
      ['RATE_LIMITED', 429],
      ['INTERNAL', 500],
    ] as const;
    for (const [code, status] of codes) {
      const block: Middleware = async () => {
        throw new AgentoraError(code, 'x');
      };
      const res = await handlerFor([block])(post('products.search', { query: 'q' }));
      expect(res.status).toBe(status);
      expect((await res.json()).error).toBe(code);
    }
  });

  it('serves the manifest at /.well-known/actions.json', async () => {
    const res = await handlerFor()(new Request('http://x/.well-known/actions.json'));
    expect(res.status).toBe(200);
    const manifest = await res.json();
    expect(manifest.actions[0].name).toBe('products.search');
  });

  it('rejects non-POST action requests with 405', async () => {
    const res = await handlerFor()(new Request('http://x/products.search'));
    expect(res.status).toBe(405);
  });

  it('streams an SSE response when the client accepts text/event-stream', async () => {
    const handler = handlerFor([], async ({ stream }) => {
      stream.log('searching');
      stream.progress(0.5);
      return { ids: ['z'] };
    });
    const res = await handler(
      post('products.search', { query: 'q' }, { accept: 'text/event-stream' })
    );
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('event: log');
    expect(text).toContain('event: progress');
    expect(text).toContain('event: result');
    expect(text).toContain('"ids":["z"]');
  });
});
