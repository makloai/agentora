// @agentora/core/json-schema — compile built-in `s` schemas to JSON Schema
// (draft 2020-12), plus the OpenAI/strict variant. The BYO resolver for
// arbitrary Standard Schemas lives alongside in ./resolve.ts.

import { type Schema, type SchemaNode, nodeOf } from './schema';

/** A JSON-serializable JSON Schema document (draft 2020-12 subset). */
export type JsonSchema = Record<string, unknown>;

/** Compile a built-in `s` schema to canonical draft-2020-12 JSON Schema. */
export function toJsonSchema(schema: Schema): JsonSchema {
  const node = nodeOf(schema);
  if (!node) {
    throw new Error('toJsonSchema: schema is not a built-in `s` schema (use resolveJsonSchema)');
  }
  return compile(node);
}

function compile(node: SchemaNode): JsonSchema {
  const out: JsonSchema = base(node);
  if (node.description !== undefined) {
    out.description = node.description;
  }
  if (node.hasDefault) {
    out.default = node.defaultValue;
  }
  return out;
}

function base(node: SchemaNode): JsonSchema {
  switch (node.kind) {
    case 'string': {
      const out: JsonSchema = { type: 'string' };
      if (node.minLength !== undefined) {
        out.minLength = node.minLength;
      }
      return out;
    }
    case 'number': {
      const out: JsonSchema = { type: 'number' };
      if (node.minimum !== undefined) {
        out.minimum = node.minimum;
      }
      return out;
    }
    case 'boolean':
      return { type: 'boolean' };
    case 'enum':
      return { type: 'string', enum: [...(node.values ?? [])] };
    case 'array':
      return { type: 'array', items: node.item ? toJsonSchema(node.item) : {} };
    case 'object': {
      const shape = node.shape ?? {};
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, child] of Object.entries(shape)) {
        const childNode = nodeOf(child);
        properties[key] = childNode ? compile(childNode) : {};
        if (!childNode?.optional && !childNode?.hasDefault) {
          required.push(key);
        }
      }
      const out: JsonSchema = { type: 'object', properties };
      if (required.length > 0) {
        out.required = required;
      }
      return out;
    }
  }
}

/**
 * Derive the OpenAI strict / Structured-Outputs variant of a JSON Schema:
 *  - every object gets `additionalProperties: false` and `properties` present
 *  - every property is listed in `required`
 *  - properties that were optional become a `["T","null"]` union
 *  - unsupported keywords (minLength/minimum/default) are dropped
 */
export function toStrictJsonSchema(schema: Schema | JsonSchema): JsonSchema {
  const canonical = isJsonSchema(schema) ? schema : toJsonSchema(schema);
  return strict(canonical);
}

function isJsonSchema(v: Schema | JsonSchema): v is JsonSchema {
  return !('~standard' in (v as object));
}

const STRIP = ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'format', 'default'];

function strict(schema: JsonSchema): JsonSchema {
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (STRIP.includes(key)) {
      continue;
    }
    out[key] = value;
  }

  if (out.type === 'array' && out.items) {
    out.items = strict(out.items as JsonSchema);
  }

  if (out.type === 'object') {
    const props = (out.properties as Record<string, JsonSchema>) ?? {};
    const originalRequired = new Set((schema.required as string[]) ?? []);
    const strictProps: Record<string, JsonSchema> = {};
    for (const [key, child] of Object.entries(props)) {
      const compiled = strict(child);
      strictProps[key] = originalRequired.has(key) ? compiled : nullable(compiled);
    }
    out.properties = strictProps;
    out.required = Object.keys(strictProps);
    out.additionalProperties = false;
  }

  return out;
}

function nullable(schema: JsonSchema): JsonSchema {
  const t = schema.type;
  if (typeof t === 'string') {
    return { ...schema, type: [t, 'null'] };
  }
  if (Array.isArray(t) && !t.includes('null')) {
    return { ...schema, type: [...t, 'null'] };
  }
  return schema;
}
