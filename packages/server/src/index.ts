// @agentora/server — the execution runtime. Server-only (may touch Node/edge APIs).
// Handlers live here, never on the contract.

import {
  type Contract,
  type Infer,
  type Manifest,
  type RouterNode,
  type Schema,
  toManifest,
} from '@agentora/core';
import { type InvokeOptions, invoke as runInvoke } from './runtime';

/** A live stream handed to handlers for logs, progress, and artifacts. */
export interface Stream {
  log(message: string, data?: unknown): void;
  progress(fraction: number): void;
  artifact(name: string, value: unknown): void;
}

export interface HandlerArgs<I, Ctx> {
  input: I;
  ctx: Ctx;
  stream: Stream;
  signal: AbortSignal;
  /** The contract being executed — middleware read its metadata (sideEffects, idempotency). */
  contract: Contract;
}

export type Handler<I, O, Ctx> = (args: HandlerArgs<I, Ctx>) => Promise<O>;

/** A contract bound to its implementation. The unit a router holds server-side. */
export interface Implemented<I extends Contract = Contract, Ctx = unknown> {
  readonly contract: I;
  readonly handler: Handler<Infer<I['input']>, Infer<I['output']>, Ctx>;
}

/** Bind a handler to a contract. The contract stays pure; this lives server-side. */
export function implement<C extends Contract, Ctx = unknown>(
  contract: C,
  handler: Handler<Infer<C['input']>, Infer<C['output']>, Ctx>
): Implemented<C, Ctx> {
  return { contract, handler };
}

/** A fused contract + handler, for trivial single-file actions. */
export type ActionDefinition<I extends Schema, O extends Schema, Ctx = unknown> = Contract<I, O> & {
  handler: Handler<Infer<I>, Infer<O>, Ctx>;
};

/**
 * One-line convenience: declare a contract and its handler together. The
 * `.contract` half is split back out pure (handler stripped) so it stays
 * isomorphic and serializable — R1 holds even via this shortcut.
 */
export function defineAction<I extends Schema, O extends Schema, Ctx = unknown>(
  def: ActionDefinition<I, O, Ctx>
): Implemented<Contract<I, O>, Ctx> {
  const { handler, ...contract } = def;
  return { contract: contract as Contract<I, O>, handler };
}

/** A composable, typed middleware. Where auth/idempotency/tracing/etc. live. */
export type Middleware<Ctx = unknown> = (
  args: HandlerArgs<unknown, Ctx>,
  next: () => Promise<unknown>
) => Promise<unknown>;

export interface CreateAppOptions<Ctx> {
  router: Record<string, RouterNode>;
  /** Per-request context factory: auth, db, identity. */
  context?: (req: Request) => Ctx | Promise<Ctx>;
  /** Ordered middleware pipeline applied around every handler. */
  use?: Middleware<Ctx>[];
}

/** A surface-agnostic application. Adapters consume this; it references no surface. */
export interface App<Ctx = unknown> {
  readonly router: Record<string, RouterNode>;
  readonly context?: (req: Request) => Ctx | Promise<Ctx>;
  readonly middleware: Middleware<Ctx>[];
  /** Resolve a dotted action name to its implementation. */
  resolve(name: string): Implemented | undefined;
  /** Run an action by dotted name through the full pipeline. */
  invoke(name: string, input: unknown, opts?: InvokeOptions): Promise<unknown>;
  /** The JSON-serializable manifest IR for every action. Adapters read this. */
  manifest(): Manifest;
}

function isImplemented(node: RouterNode): node is Implemented {
  const n = node as Partial<Implemented>;
  return !!n.contract && typeof n.handler === 'function';
}

function isContract(node: RouterNode): node is Contract {
  const n = node as Partial<Contract>;
  return typeof n.name === 'string' && 'input' in n && 'output' in n;
}

/** Build a flat dotted-name -> implementation index from the router tree. */
function indexRouter(node: RouterNode, into: Map<string, Implemented>): void {
  if (isImplemented(node)) {
    into.set(node.contract.name, node);
    return;
  }
  if (isContract(node)) {
    // A bare (unimplemented) contract: known to the manifest but not invokable.
    return;
  }
  for (const child of Object.values(node)) {
    indexRouter(child, into);
  }
}

export function createApp<Ctx = unknown>(opts: CreateAppOptions<Ctx>): App<Ctx> {
  const index = new Map<string, Implemented>();
  for (const node of Object.values(opts.router)) {
    indexRouter(node, index);
  }

  const app: App<Ctx> = {
    router: opts.router,
    context: opts.context,
    middleware: opts.use ?? [],
    resolve(name: string) {
      return index.get(name);
    },
    invoke(name, input, invokeOpts) {
      return runInvoke(app as App, name, input, invokeOpts);
    },
    manifest() {
      return toManifest(opts.router);
    },
  };

  return app;
}

export type { InvokeOptions } from './runtime';
export { router } from '@agentora/core';
