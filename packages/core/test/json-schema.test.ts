import { describe, expect, it } from 'vitest';
import { s, toJsonSchema, toStrictJsonSchema } from '../src/index';

describe('toJsonSchema — built-in `s` compiler', () => {
  it('compiles an object with min and default', () => {
    const schema = s.object({
      query: s.string().min(1),
      limit: s.number().default(10),
    });
    expect(toJsonSchema(schema)).toEqual({
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1 },
        limit: { type: 'number', default: 10 },
      },
      // limit has a default, so it is NOT required
      required: ['query'],
    });
  });

  it('compiles an enum to a string with enum members', () => {
    expect(toJsonSchema(s.enum(['a', 'b']))).toEqual({ type: 'string', enum: ['a', 'b'] });
  });

  it('compiles an array of strings', () => {
    expect(toJsonSchema(s.array(s.string()))).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('omits optional fields from required but keeps them in properties', () => {
    const schema = s.object({ name: s.string(), nick: s.string().optional() });
    const json = toJsonSchema(schema);
    expect(json.required).toEqual(['name']);
    expect((json.properties as Record<string, unknown>).nick).toEqual({ type: 'string' });
  });

  it('recurses into nested objects with their own required', () => {
    const schema = s.object({
      user: s.object({ id: s.string(), bio: s.string().optional() }),
    });
    expect(toJsonSchema(schema)).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: { id: { type: 'string' }, bio: { type: 'string' } },
          required: ['id'],
        },
      },
      required: ['user'],
    });
  });

  it('carries a description when set via describe()', () => {
    expect(toJsonSchema(s.string().describe('the search query'))).toEqual({
      type: 'string',
      description: 'the search query',
    });
  });
});

describe('toStrictJsonSchema — OpenAI variant', () => {
  it('closes every object, marks all properties required, and null-unions optionals', () => {
    const schema = s.object({
      query: s.string().min(1),
      limit: s.number().default(10),
    });
    expect(toStrictJsonSchema(schema)).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string' }, // minLength stripped under strict
        limit: { type: ['number', 'null'] }, // defaulted -> nullable, still required
      },
      required: ['query', 'limit'],
    });
  });

  it('accepts an already-compiled JSON Schema', () => {
    const json = toJsonSchema(s.object({ a: s.string() }));
    expect(toStrictJsonSchema(json)).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: { a: { type: 'string' } },
      required: ['a'],
    });
  });
});

describe('round-trip sanity', () => {
  it('a value accepted by validate conforms to the emitted required set', () => {
    const schema = s.object({ query: s.string(), limit: s.number().default(10) });
    const result = schema['~standard'].validate({ query: 'shoes' });
    expect('value' in result).toBe(true);
    // query is required in JSON Schema and present; limit defaulted in.
    expect(toJsonSchema(schema).required).toEqual(['query']);
  });
});
