import type { StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it } from 'vitest';
import { type Schema, registerVendorConverter, resolveJsonSchema, s } from '../src/index';

/** A fake Standard Schema with no introspection (only validate + vendor). */
function opaqueSchema(vendor: string): Schema {
  return {
    '~standard': {
      version: 1,
      vendor,
      validate: (v: unknown) => ({ value: v }) as StandardSchemaV1.Result<unknown>,
    },
  };
}

/** A fake schema that implements the `~standard.jsonSchema` companion spec. */
function companionSchema(json: Record<string, unknown>): Schema {
  return {
    '~standard': {
      version: 1,
      vendor: 'fake-companion',
      validate: (v: unknown) => ({ value: v }) as StandardSchemaV1.Result<unknown>,
      jsonSchema: { input: () => json, output: () => json },
    },
  } as unknown as Schema;
}

describe('resolveJsonSchema', () => {
  it('uses the direct compiler for built-in `s` schemas', () => {
    expect(resolveJsonSchema(s.object({ q: s.string() }))).toEqual({
      type: 'object',
      properties: { q: { type: 'string' } },
      required: ['q'],
    });
  });

  it('uses the ~standard.jsonSchema companion when present', () => {
    const json = { type: 'string', format: 'email' };
    expect(resolveJsonSchema(companionSchema(json))).toEqual(json);
  });

  it('uses a registered vendor converter', () => {
    registerVendorConverter('acme', () => ({ type: 'boolean' }));
    expect(resolveJsonSchema(opaqueSchema('acme'))).toEqual({ type: 'boolean' });
  });

  it('throws an actionable error for an opaque schema', () => {
    expect(() => resolveJsonSchema(opaqueSchema('mystery'))).toThrowError(/mystery/);
  });

  afterEach(() => {
    // converters registry is module-global; nothing to clean for distinct vendors
  });
});
