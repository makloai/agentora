// @agentora/server — the execution runtime. Server-only (may touch Node/edge APIs).
// Handlers live here, never on the contract.

import type { Contract, Infer, RouterNode } from '@agentora/core';

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
}

export function createApp<Ctx = unknown>(opts: CreateAppOptions<Ctx>): App<Ctx> {
  return {
    router: opts.router,
    context: opts.context,
    middleware: opts.use ?? [],
    resolve() {
      // TODO: walk the router tree, run the middleware chain around the handler.
      return undefined;
    },
  };
}

export { router } from '@agentora/core';
