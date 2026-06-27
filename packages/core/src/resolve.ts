// @agentora/core/resolve — turn ANY schema into JSON Schema.
//
// Standard Schema v1 exposes only `validate()` + `vendor` at runtime — there is
// no structural introspection. So a universal converter is impossible. We use a
// tiered resolver:
//   1. built-in `s` schema        → compile directly (./json-schema)
//   2. `~standard.jsonSchema`      → the Standard JSON Schema companion spec
//   3. a registered vendor adapter → per-vendor converter (no bundled deps)
//   4. otherwise                   → throw, instructing the user to supply one

import { type JsonSchema, toJsonSchema } from './json-schema';
import { type Schema, nodeOf } from './schema';

type VendorConverter = (schema: Schema) => JsonSchema;

const vendorConverters = new Map<string, VendorConverter>();

/** Register a per-vendor Standard Schema → JSON Schema converter (e.g. for Zod 3). */
export function registerVendorConverter(vendor: string, convert: VendorConverter): void {
  vendorConverters.set(vendor, convert);
}

interface StandardJsonSchemaCompanion {
  input?: (options: { target: string }) => JsonSchema;
  output?: (options: { target: string }) => JsonSchema;
}

interface StandardInternals {
  vendor: string;
  jsonSchema?: StandardJsonSchemaCompanion;
}

function standardOf(schema: Schema): StandardInternals | undefined {
  return (schema as { '~standard'?: StandardInternals })['~standard'];
}

/**
 * Resolve a schema to JSON Schema (draft 2020-12). Handles the built-in `s`
 * builder, the `~standard.jsonSchema` companion spec, and registered vendors.
 * Throws an actionable error for opaque Standard Schemas.
 *
 * @param which whether to read the input or output side of the companion spec
 */
export function resolveJsonSchema(schema: Schema, which: 'input' | 'output' = 'input'): JsonSchema {
  // 1. Built-in `s` schema — we own the structure.
  if (nodeOf(schema)) {
    return toJsonSchema(schema);
  }

  const std = standardOf(schema);

  // 2. Standard JSON Schema companion spec — vendor-agnostic.
  const companion = std?.jsonSchema?.[which];
  if (typeof companion === 'function') {
    return companion({ target: 'draft-2020-12' });
  }

  // 3. Registered per-vendor converter.
  const converter = std?.vendor ? vendorConverters.get(std.vendor) : undefined;
  if (converter) {
    return converter(schema);
  }

  // 4. No path available.
  const vendor = std?.vendor ?? 'unknown';
  throw new Error(
    `resolveJsonSchema: cannot derive JSON Schema for vendor "${vendor}". Use the built-in \`s\` builder, a schema library implementing the \`~standard.jsonSchema\` companion spec (Zod 4.2+, Valibot 1.2+, ArkType 2.1+), or register a converter via registerVendorConverter().`
  );
}
