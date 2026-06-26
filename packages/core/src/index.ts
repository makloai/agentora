// @agentora/core — isomorphic, zero runtime-dependency.
// Contracts, schema, router, and the manifest IR live here. No handlers, no Node APIs.
// The only dependency is `@standard-schema/spec`, which is types-only (fully elided at build).

import type { StandardSchemaV1 } from '@standard-schema/spec';

/** A Standard Schema v1-compatible validator. */
export type Schema<T = unknown> = StandardSchemaV1<unknown, T>;

/** Infer the output type of a schema. */
export type Infer<S> = S extends StandardSchemaV1<unknown, infer T> ? T : never;

export type SideEffects = 'none' | 'read' | 'write';
export type Idempotency = 'none' | 'conditional' | 'always';

/** A pure capability declaration. Carries no handler — safe to import anywhere. */
export interface Contract<I extends Schema = Schema, O extends Schema = Schema> {
  readonly name: string;
  readonly description?: string;
  readonly sideEffects?: SideEffects;
  readonly idempotency?: Idempotency;
  readonly input: I;
  readonly output: O;
}

/** Declare a contract. Identity at runtime; the value carries the types. */
export function defineContract<I extends Schema, O extends Schema>(
  contract: Contract<I, O>
): Contract<I, O> {
  return contract;
}

/** A node in a router tree: a contract (or implemented contract) or a nested group. */
export type RouterNode = Contract | { readonly [k: string]: RouterNode };

/** Compose contracts (or implementations) into a typed, namespaced tree. */
export function router<T extends Record<string, RouterNode>>(tree: T): T {
  return tree;
}

// ----------------------------------------------------------------------------
// Manifest IR — the JSON-serializable description that powers doctor, discovery,
// and external clients.
// ----------------------------------------------------------------------------

/** JSON-serializable description of one contract. */
export interface ManifestEntry {
  name: string;
  description?: string;
  sideEffects: SideEffects;
  idempotency: Idempotency;
  // TODO: JSON Schema compiled from input/output via a Standard Schema → JSON Schema step.
  input: unknown;
  output: unknown;
}

export interface Manifest {
  version: 1;
  actions: ManifestEntry[];
}

/** Walk a router tree and emit the manifest IR. */
export function toManifest(_tree: Record<string, RouterNode>): Manifest {
  // TODO: traverse the tree, compile schemas to JSON Schema, collect entries.
  return { version: 1, actions: [] };
}

// ----------------------------------------------------------------------------
// Error taxonomy — shared across every surface.
// ----------------------------------------------------------------------------

export type ErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'CANCELLED'
  | 'INTERNAL';

export class AgentoraError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly data?: unknown
  ) {
    super(message);
    this.name = 'AgentoraError';
  }
}

// ----------------------------------------------------------------------------
// `s` — a minimal Standard Schema builder covering the primitives. You can use
// any Standard Schema library (Zod, Valibot, ArkType) instead; `s` ships so the
// SDK works zero-install. NOTE: validation here is synchronous-only.
// ----------------------------------------------------------------------------

type Result<T> = StandardSchemaV1.Result<T>;

const vendor = 'agentora';

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
  optional(): Refinable<T | undefined>;
  default(value: T): Refinable<T>;
  /** Minimum string length / numeric value. No-op for other types. */
  min(bound: number): Refinable<T>;
}

function refinable<T>(validate: (value: unknown) => Result<T>): Refinable<T> {
  return {
    '~standard': { version: 1, vendor, validate },
    optional() {
      return refinable<T | undefined>((value) =>
        value === undefined ? succeed(undefined) : validate(value)
      );
    },
    default(fallback: T) {
      return refinable<T>((value) => (value === undefined ? succeed(fallback) : validate(value)));
    },
    min(bound: number) {
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
      });
    },
  };
}

export const s = {
  string: () =>
    refinable<string>((v) => (typeof v === 'string' ? succeed(v) : failWith('expected string'))),
  number: () =>
    refinable<number>((v) => (typeof v === 'number' ? succeed(v) : failWith('expected number'))),
  boolean: () =>
    refinable<boolean>((v) => (typeof v === 'boolean' ? succeed(v) : failWith('expected boolean'))),
  enum: <const E extends readonly [string, ...string[]]>(values: E) =>
    refinable<E[number]>((v) =>
      typeof v === 'string' && (values as readonly string[]).includes(v)
        ? succeed(v as E[number])
        : failWith(`expected one of: ${values.join(', ')}`)
    ),
  array: <S extends Schema>(item: S) =>
    refinable<Infer<S>[]>((v) => {
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
    }),
  object: <Shape extends Record<string, Schema>>(shape: Shape) =>
    refinable<{ [K in keyof Shape]: Infer<Shape[K]> }>((v) => {
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
    }),
} as const;
