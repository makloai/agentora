import { describe, expect, it } from 'vitest';
import { type Infer, defineContract, s } from '../src/index';

describe('s — minimal Standard Schema builder', () => {
  it('validates objects with defaults', () => {
    const schema = s.object({
      query: s.string().min(1),
      limit: s.number().default(10),
    });

    const result = schema['~standard'].validate({ query: 'shoes' });
    expect('value' in result && result.value).toEqual({ query: 'shoes', limit: 10 });
  });

  it('reports issues on bad input', () => {
    const schema = s.object({ query: s.string() });
    const result = schema['~standard'].validate({ query: 123 });
    expect('issues' in result && result.issues?.length).toBe(1);
  });
});

describe('defineContract', () => {
  it('carries input/output types without a handler', () => {
    const searchProducts = defineContract({
      name: 'products.search',
      sideEffects: 'read',
      input: s.object({ query: s.string(), limit: s.number().default(10) }),
      output: s.object({ ids: s.array(s.string()) }),
    });

    expect(searchProducts.name).toBe('products.search');

    // Type-level check: Infer resolves the input shape.
    type Input = Infer<typeof searchProducts.input>;
    const sample: Input = { query: 'a', limit: 1 };
    expect(sample.query).toBe('a');
  });
});
