// @agentora/server/middleware — the home for cross-cutting concerns.
// Each is a typed, composable Middleware. Per-contract metadata (sideEffects,
// idempotency) is read from args.contract; the `doctor` lints for their presence.

import { AgentoraError } from '@agentora/core';
import type { HandlerArgs, Middleware, Stream } from './index';
import { type Store, memoryStore } from './store';

type Args = HandlerArgs<unknown, unknown>;

const RETRYABLE: ReadonlySet<string> = new Set(['RATE_LIMITED', 'INTERNAL']);

// ----------------------------------------------------------------------------
// trace — observability around every attempt.
// ----------------------------------------------------------------------------

export interface TraceEvent {
  action: string;
  phase: 'start' | 'end';
  ok?: boolean;
  durationMs?: number;
  error?: unknown;
}

export function trace(opts: { onEvent?: (e: TraceEvent) => void } = {}): Middleware {
  return async (args, next) => {
    const action = (args as Args).contract.name;
    const startedAt = nowMs();
    opts.onEvent?.({ action, phase: 'start' });
    try {
      const result = await next();
      opts.onEvent?.({ action, phase: 'end', ok: true, durationMs: nowMs() - startedAt });
      return result;
    } catch (err) {
      opts.onEvent?.({
        action,
        phase: 'end',
        ok: false,
        durationMs: nowMs() - startedAt,
        error: err,
      });
      throw err;
    }
  };
}

// ----------------------------------------------------------------------------
// auth — authentication + scope checks read from ctx.
// ----------------------------------------------------------------------------

export interface AuthIdentity {
  scopes?: string[];
}

export interface AuthContext {
  user?: AuthIdentity | null;
}

export interface AuthOptions {
  /** Force authentication even for read actions (writes always require it). */
  require?: boolean;
  /** Scopes the caller must hold for this action. */
  scopes?: string[] | ((args: Args) => string[]);
}

export function auth(opts: AuthOptions = {}): Middleware {
  return async (args, next) => {
    const a = args as Args;
    const declared = a.contract.auth;

    // A contract marked `auth: 'public'` opts out of authentication entirely.
    if (declared === 'public') {
      return next();
    }

    const user = (a.ctx as AuthContext | undefined)?.user;
    const needsAuth =
      opts.require === true || a.contract.sideEffects === 'write' || declared !== undefined;

    if (needsAuth && !user) {
      throw new AgentoraError('UNAUTHENTICATED', 'authentication required');
    }

    // Required scopes come from the contract's declared auth and any passed to auth().
    const declaredScopes = declared?.scopes ?? [];
    const optScopes = typeof opts.scopes === 'function' ? opts.scopes(a) : (opts.scopes ?? []);
    const required = [...declaredScopes, ...optScopes];
    if (required.length > 0) {
      const held = new Set(user?.scopes ?? []);
      for (const scope of required) {
        if (!held.has(scope)) {
          throw new AgentoraError('FORBIDDEN', `missing required scope: ${scope}`);
        }
      }
    }

    return next();
  };
}

// ----------------------------------------------------------------------------
// idempotency — replay the first result for a key on write actions.
// ----------------------------------------------------------------------------

export interface IdempotencyOptions {
  store?: Store;
  /** Derive the dedupe key for a call. Defaults to action name + serialized input. */
  key?: (args: Args) => string | undefined;
}

export function idempotency(opts: IdempotencyOptions = {}): Middleware {
  const store = opts.store ?? memoryStore();
  return async (args, next) => {
    const a = args as Args;
    if (a.contract.sideEffects !== 'write') {
      return next();
    }
    const key = opts.key?.(a) ?? `${a.contract.name}:${stableStringify(a.input)}`;
    if (await store.has(key)) {
      return store.get(key);
    }
    const result = await next();
    await store.set(key, result);
    return result;
  };
}

// ----------------------------------------------------------------------------
// concurrency — bounded in-flight calls per action name.
// ----------------------------------------------------------------------------

export function concurrency(limit: number): Middleware {
  const active = new Map<string, number>();
  const waiters = new Map<string, Array<() => void>>();

  const acquire = (name: string, max: number) =>
    new Promise<void>((resolve) => {
      const running = active.get(name) ?? 0;
      if (running < max) {
        active.set(name, running + 1);
        resolve();
      } else {
        const queue = waiters.get(name) ?? [];
        queue.push(resolve);
        waiters.set(name, queue);
      }
    });

  const release = (name: string) => {
    const queue = waiters.get(name);
    if (queue && queue.length > 0) {
      const nextWaiter = queue.shift();
      nextWaiter?.();
    } else {
      active.set(name, Math.max(0, (active.get(name) ?? 1) - 1));
    }
  };

  return async (args, next) => {
    const contract = (args as Args).contract;
    // The contract's declared bound wins; fall back to the global default.
    const max = contract.concurrency ?? limit;
    await acquire(contract.name, max);
    try {
      return await next();
    } finally {
      release(contract.name);
    }
  };
}

// ----------------------------------------------------------------------------
// retry — backoff for read actions; respects cancellation.
// ----------------------------------------------------------------------------

export interface RetryOptions {
  /** Base backoff in ms (exponential). Default 10. */
  baseMs?: number;
}

export function retry(times: number, opts: RetryOptions = {}): Middleware {
  const baseMs = opts.baseMs ?? 10;
  return async (args, next) => {
    const a = args as Args;
    let lastError: unknown;
    for (let attempt = 0; attempt <= times; attempt++) {
      if (a.signal.aborted) {
        throw new AgentoraError('CANCELLED', 'action cancelled');
      }
      try {
        return await next();
      } catch (err) {
        lastError = err;
        if (err instanceof AgentoraError && !RETRYABLE.has(err.code)) {
          throw err;
        }
        if (attempt < times) {
          await delay(baseMs * 2 ** attempt, a.signal);
        }
      }
    }
    throw lastError;
  };
}

// ----------------------------------------------------------------------------
// redact — scrub configured keys from stream payloads.
// ----------------------------------------------------------------------------

const DEFAULT_REDACT = ['password', 'token', 'secret', 'authorization', 'apiKey', 'api_key'];

export function redact(opts: { keys?: string[] } = {}): Middleware {
  const keys = new Set((opts.keys ?? DEFAULT_REDACT).map((k) => k.toLowerCase()));
  const scrub = (value: unknown): unknown => deepScrub(value, keys);
  return async (args, next) => {
    const a = args as Args;
    const original = a.stream;
    const wrapped: Stream = {
      log: (message, data) => original.log(message, data === undefined ? data : scrub(data)),
      progress: (fraction) => original.progress(fraction),
      artifact: (name, value) => original.artifact(name, scrub(value)),
    };
    a.stream = wrapped;
    return next();
  };
}

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------

function nowMs(): number {
  // performance.now is available on Node >=20 and edge runtimes.
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AgentoraError('CANCELLED', 'action cancelled'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function deepScrub(value: unknown, keys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => deepScrub(v, keys));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = keys.has(k.toLowerCase()) ? '[REDACTED]' : deepScrub(v, keys);
    }
    return out;
  }
  return value;
}

function stableStringify(value: unknown): string {
  // Codepoint comparison, not localeCompare — the key must be identical across
  // runtimes/locales so a shared idempotency Store dedupes correctly.
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v
  );
}

export { memoryStore } from './store';
export type { Store } from './store';
