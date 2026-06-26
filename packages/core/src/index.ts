// @agentora/core — isomorphic, zero-dependency.
// Contracts, schema, router, and the manifest IR live here. No handlers, no Node APIs.

/**
 * A Standard Schema v1-compatible validator. We intentionally avoid a hard
 * dependency on `@standard-schema/spec` in this scaffold; the real type will be
 * `import('@standard-schema/spec').StandardSchemaV1`.
 */
export type Schema<T = unknown> = {
  readonly '~standard': { readonly version: 1; readonly vendor: string };
  readonly __out?: T;
};

export type Infer<S> = S extends Schema<infer T> ? T : never;

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

/** A node in a router tree: a contract (or an implemented contract) or a nested group. */
export type RouterNode = Contract | { readonly [k: string]: RouterNode };

/** Compose contracts (or implementations) into a typed, namespaced tree. */
export function router<T extends Record<string, RouterNode>>(tree: T): T {
  return tree;
}

/** JSON-serializable description of one contract — the unit of the manifest IR. */
export interface ManifestEntry {
  name: string;
  description?: string;
  sideEffects: SideEffects;
  idempotency: Idempotency;
  // TODO: JSON Schema compiled from input/output via the Standard Schema adapter.
  input: unknown;
  output: unknown;
}

export interface Manifest {
  version: 1;
  actions: ManifestEntry[];
}

/** Walk a router tree and emit the manifest IR. Powers `doctor`, discovery, and clients. */
export function toManifest(_tree: Record<string, RouterNode>): Manifest {
  // TODO: traverse the tree, compile schemas to JSON Schema, collect entries.
  return { version: 1, actions: [] };
}

/** Typed error taxonomy shared across every surface. */
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

/**
 * Schema namespace. In the real package this re-exports a Standard Schema
 * builder (e.g. a thin wrapper so we control the manifest IR). Stubbed here.
 */
export const s = {
  // TODO: object/string/number/array/enum builders returning `Schema<T>`.
} as const;
