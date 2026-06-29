import { describe, expect, it } from 'vitest';
import { type RouterNode, defineContract, router, s, toManifest } from '../src/index';

const searchProducts = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ ids: s.array(s.string()) }),
});

describe('toManifest', () => {
  it('emits one entry per contract with compiled schemas', () => {
    const m = toManifest(router({ products: { search: searchProducts } }));
    expect(m.version).toBe(1);
    expect(m.actions).toHaveLength(1);
    const [entry] = m.actions;
    expect(entry?.name).toBe('products.search');
    expect(entry?.description).toBe('Search the catalog');
    expect(entry?.sideEffects).toBe('read');
    expect(entry?.input).toMatchObject({ type: 'object', required: ['query'] });
    expect(entry?.output).toMatchObject({ type: 'object' });
  });

  it('walks nested groups three levels deep', () => {
    const c = defineContract({
      name: 'a.b.c',
      input: s.object({}),
      output: s.object({}),
    });
    const m = toManifest(router({ a: { b: { c } } }) as Record<string, RouterNode>);
    expect(m.actions.map((a) => a.name)).toEqual(['a.b.c']);
  });

  it('treats an implemented node ({ contract, handler }) as a leaf', () => {
    const impl = { contract: searchProducts, handler: async () => ({ ids: [] }) };
    const m = toManifest({ products: { search: impl } } as unknown as Record<string, RouterNode>);
    expect(m.actions).toHaveLength(1);
    expect(m.actions[0]?.name).toBe('products.search');
  });

  it('applies defaults for sideEffects and idempotency', () => {
    const c = defineContract({ name: 'x', input: s.object({}), output: s.object({}) });
    const m = toManifest({ x: c });
    expect(m.actions[0]?.sideEffects).toBe('none');
    expect(m.actions[0]?.idempotency).toBe('none');
  });

  it('returns an empty manifest for an empty router', () => {
    expect(toManifest({})).toEqual({ version: 1, actions: [] });
  });

  it('is JSON round-trippable', () => {
    const m = toManifest(router({ products: { search: searchProducts } }));
    expect(JSON.parse(JSON.stringify(m))).toEqual(m);
  });
});
