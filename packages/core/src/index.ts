// @agentora/core — isomorphic, zero runtime-dependency.
// Contracts, schema, router, and the manifest IR live here. No handlers, no Node APIs.
// The only dependency is `@standard-schema/spec`, which is types-only (fully elided at build).

import type { Schema } from './schema';

export type { Schema, Infer, Refinable, SchemaNode } from './schema';
export { s, nodeOf, NODE } from './schema';
export type { JsonSchema } from './json-schema';
export { toJsonSchema, toStrictJsonSchema } from './json-schema';
export { resolveJsonSchema, registerVendorConverter } from './resolve';
export { toManifest } from './manifest';

export type SideEffects = 'none' | 'read' | 'write';
export type Idempotency = 'none' | 'conditional' | 'always';

/** Declarative permission requirement. `'public'` is an explicit opt-out of auth. */
export type AuthRequirement = 'public' | { readonly scopes?: readonly string[] };

/** A pure capability declaration. Carries no handler — safe to import anywhere. */
export interface Contract<I extends Schema = Schema, O extends Schema = Schema> {
  readonly name: string;
  readonly description?: string;
  readonly sideEffects?: SideEffects;
  readonly idempotency?: Idempotency;
  /** Declarative permission requirement read by auth middleware and doctor. */
  readonly auth?: AuthRequirement;
  /** Declarative bounded-concurrency hint read by concurrency middleware and doctor. */
  readonly concurrency?: number;
  readonly input: I;
  readonly output: O;
}

/** Declare a contract. Identity at runtime; the value carries the types. */
export function defineContract<I extends Schema, O extends Schema>(
  contract: Contract<I, O>
): Contract<I, O> {
  return contract;
}

/** A leaf in a router tree: a bare contract, or a contract bound to a handler. */
export type RouterLeaf = Contract | { readonly contract: Contract };

/** A node in a router tree: a leaf (contract / implemented contract) or a nested group. */
export type RouterNode = RouterLeaf | { readonly [k: string]: RouterNode };

/** Compose contracts (or implementations) into a typed, namespaced tree. */
export function router<T extends Record<string, RouterNode>>(tree: T): T {
  return tree;
}

// ----------------------------------------------------------------------------
// Manifest IR — the JSON-serializable description that powers doctor, discovery,
// and external clients. The traversal lives in ./manifest.ts.
// ----------------------------------------------------------------------------

/** JSON-serializable description of one contract. */
export interface ManifestEntry {
  name: string;
  description?: string;
  sideEffects: SideEffects;
  idempotency: Idempotency;
  /** Declarative permission requirement, when the contract declares one. */
  auth?: AuthRequirement;
  /** Declarative bounded-concurrency hint, when the contract declares one. */
  concurrency?: number;
  /** JSON Schema compiled from the contract input/output. */
  input: unknown;
  output: unknown;
}

export interface Manifest {
  version: 1;
  actions: ManifestEntry[];
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
