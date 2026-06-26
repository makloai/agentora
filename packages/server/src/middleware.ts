// @agentora/server/middleware — the home for cross-cutting concerns.
// Each is a typed, composable Middleware. Per-contract metadata (sideEffects,
// idempotency) is read here; the `doctor` lints for their presence.

import type { Middleware } from './index';

/** Tracing/observability around every attempt. */
export function trace(): Middleware {
  return async (_args, next) => next(); // TODO: spans, timing, replay hooks.
}

/** Authn/authz: scopes + ownership checks (MCP OAuth 2.1 heritage). */
export function auth(): Middleware {
  return async (_args, next) => next(); // TODO: enforce scopes/ownership from ctx.
}

/** Idempotency keys for write actions. */
export function idempotency(): Middleware {
  return async (_args, next) => next(); // TODO: dedupe by key + sideEffects metadata.
}

/** Bounded concurrency per action. */
export function concurrency(_limit: number): Middleware {
  return async (_args, next) => next(); // TODO: semaphore per contract name.
}

/** Retry with backoff for read actions. */
export function retry(_times: number): Middleware {
  return async (_args, next) => next(); // TODO: backoff, respect cancellation.
}

/** Redact secrets from logs/streams. */
export function redact(): Middleware {
  return async (_args, next) => next(); // TODO: scrub configured keys.
}
