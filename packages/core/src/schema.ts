// @agentora/core/schema — the built-in `s` builder.
//
// Each schema is a valid Standard Schema (`~standard.validate`) AND carries an
// introspectable structural descriptor under a private symbol. Standard Schema
// v1 exposes no runtime introspection, so to compile our own schemas to JSON
// Schema we keep the structure ourselves. See ./json-schema.ts for the compiler.

import type { StandardSchemaV1 } from '@standard-schema/spec';

/** A Standard Schema v1-compatible validator. */
export type Schema<T = unknown> = StandardSchemaV1<unknown, T>;

/** Infer the output type of a schema. */
export type Infer<S> = S extends StandardSchemaV1<unknown, infer T> ? T : never;

type Result<T> = StandardSchemaV1.Result<T>;

const vendor = 'agentora';

/** Private marker carrying the structural descriptor for the JSON Schema compiler. */
export const NODE = Symbol.for('agentora.schema.node');

/** The introspectable structure behind a built-in schema. */
export interface SchemaNode {
  readonly kind: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
  /** enum members */
  readonly values?: readonly string[];
  /** array item schema */
  readonly item?: Schema;
  /** object property schemas */
  readonly shape?: Record<string, Schema>;
  /** string minLength */
  readonly minLength?: number;
  /** numeric minimum */
  readonly minimum?: number;
  /** field is optional (absent allowed) — excluded from `required` */
  readonly optional?: boolean;
  /** a default is supplied — excluded from `required` */
  readonly hasDefault?: boolean;
  readonly defaultValue?: unknown;
  readonly description?: string;
}

/** Read the structural descriptor off a schema, if it is a built-in `s` node. */
export function nodeOf(schema: unknown): SchemaNode | undefined {
  return (schema as { [NODE]?: SchemaNode })?.[NODE];
}

function succeed<T>(value: T): Result<T> {
  return { value };
}

function failWith(message: string): StandardSchemaV1.FailureResult {
  return { issues: [{ message }] };
}

function isFailure(result: Result<unknown>): result is StandardSchemaV1.FailureResult {
  return result.issues !== undefined;
}

/** A schema with chainable refinements. */
export interface Refinable<T> extends Schema<T> {
  readonly [NODE]: SchemaNode;
  optional(): Refinable<T | undefined>;
  default(value: T): Refinable<T>;
  /** Minimum string length / numeric value. No-op for other types. */
  min(bound: number): Refinable<T>;
  /** Attach a human-readable description (surfaces in JSON Schema + tool specs). */
  describe(text: string): Refinable<T>;
}

function refinable<T>(validate: (value: unknown) => Result<T>, node: SchemaNode): Refinable<T> {
  return {
    '~standard': { version: 1, vendor, validate },
    [NODE]: node,
    optional() {
      return refinable<T | undefined>(
        (value) => (value === undefined ? succeed(undefined) : validate(value)),
        { ...node, optional: true }
      );
    },
    default(fallback: T) {
      return refinable<T>((value) => (value === undefined ? succeed(fallback) : validate(value)), {
        ...node,
        hasDefault: true,
        defaultValue: fallback,
      });
    },
    min(bound: number) {
      const refined: SchemaNode =
        node.kind === 'string'
          ? { ...node, minLength: bound }
          : node.kind === 'number'
            ? { ...node, minimum: bound }
            : node;
      return refinable<T>((value) => {
        const result = validate(value);
        if (isFailure(result)) {
          return result;
        }
        const v = result.value;
        if (typeof v === 'string' && v.length < bound) {
          return failWith(`expected length >= ${bound}`);
        }
        if (typeof v === 'number' && v < bound) {
          return failWith(`expected >= ${bound}`);
        }

        return result;
      }, refined);
    },
    describe(text: string) {
      return refinable<T>(validate, { ...node, description: text });
    },
  };
}

export const s = {
  string: () =>
    refinable<string>((v) => (typeof v === 'string' ? succeed(v) : failWith('expected string')), {
      kind: 'string',
    }),
  number: () =>
    refinable<number>((v) => (typeof v === 'number' ? succeed(v) : failWith('expected number')), {
      kind: 'number',
    }),
  boolean: () =>
    refinable<boolean>(
      (v) => (typeof v === 'boolean' ? succeed(v) : failWith('expected boolean')),
      { kind: 'boolean' }
    ),
  enum: <const E extends readonly [string, ...string[]]>(values: E) =>
    refinable<E[number]>(
      (v) =>
        typeof v === 'string' && (values as readonly string[]).includes(v)
          ? succeed(v as E[number])
          : failWith(`expected one of: ${values.join(', ')}`),
      { kind: 'enum', values }
    ),
  array: <S extends Schema>(item: S) =>
    refinable<Infer<S>[]>(
      (v) => {
        if (!Array.isArray(v)) {
          return failWith('expected array');
        }
        const out: Infer<S>[] = [];
        for (const element of v) {
          const result = item['~standard'].validate(element) as Result<Infer<S>>;
          if (isFailure(result)) {
            return result;
          }
          out.push(result.value);
        }

        return succeed(out);
      },
      { kind: 'array', item }
    ),
  object: <Shape extends Record<string, Schema>>(shape: Shape) =>
    refinable<{ [K in keyof Shape]: Infer<Shape[K]> }>(
      (v) => {
        if (typeof v !== 'object' || v === null) {
          return failWith('expected object');
        }
        const record = v as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const [key, schema] of Object.entries(shape)) {
          const result = schema['~standard'].validate(record[key]) as Result<unknown>;
          if (isFailure(result)) {
            return result;
          }
          out[key] = result.value;
        }

        return succeed(out as { [K in keyof Shape]: Infer<Shape[K]> });
      },
      { kind: 'object', shape }
    ),
} as const;
