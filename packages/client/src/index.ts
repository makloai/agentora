// @agentora/client — a typed client built from CONTRACTS only. No server import,
// safe in a browser/edge bundle. It POSTs to an @agentora/http handler.
import { AgentoraError, type Contract, type ErrorCode, type Infer } from '@agentora/core';

export interface ClientOptions {
  /** Base URL of the HTTP handler, e.g. "/api" or "https://x/api". */
  url: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  /** Override the fetch implementation (tests, custom runtimes). */
  fetch?: typeof fetch;
}

/** Recursively map a contract tree to callable, typed client methods. */
export type Client<T> = {
  [K in keyof T]: T[K] extends Contract
    ? (input: Infer<T[K]['input']>) => Promise<Infer<T[K]['output']>>
    : Client<T[K]>;
};

/** Create a typed client. `T` is the shape of your contracts tree (`typeof contracts`). */
export function createClient<T>(opts: ClientOptions): Client<T> {
  return proxy<T>([], opts);
}

function proxy<T>(path: string[], opts: ClientOptions): Client<T> {
  const call = (input: unknown) => invoke(path.join('.'), input, opts);
  return new Proxy(call, {
    get(_target, prop) {
      // Never look thenable: a namespace node returned/awaited in an async
      // context must not be unwrapped as a promise (it would POST to `…/then`).
      if (typeof prop !== 'string' || prop === 'then') {
        return undefined;
      }
      return proxy([...path, prop], opts);
    },
  }) as unknown as Client<T>;
}

async function invoke(name: string, input: unknown, opts: ClientOptions): Promise<unknown> {
  const fetchImpl = opts.fetch ?? fetch;
  const headers = typeof opts.headers === 'function' ? opts.headers() : (opts.headers ?? {});
  const res = await fetchImpl(`${opts.url.replace(/\/+$/, '')}/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(input ?? {}),
  });

  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    const body = data as { error?: string; message?: string; data?: unknown } | undefined;
    throw new AgentoraError(
      (body?.error as ErrorCode) ?? 'INTERNAL',
      body?.message ?? res.statusText,
      body?.data
    );
  }
  return data;
}
