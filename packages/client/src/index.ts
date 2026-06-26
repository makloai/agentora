// @agentora/client — a typed client built from CONTRACTS only. No server import,
// safe in a browser/edge bundle.
import { type Contract, type Infer } from '@agentora/core';

export interface ClientOptions {
  url: string;
  headers?: Record<string, string> | (() => Record<string, string>);
}

/** Recursively map a contract tree to callable, typed client methods. */
export type Client<T> = {
  [K in keyof T]: T[K] extends Contract
    ? (input: Infer<T[K]['input']>) => Promise<Infer<T[K]['output']>>
    : Client<T[K]>;
};

/** Create a typed client. `T` is the shape of your contracts tree (`typeof contracts`). */
export function createClient<T>(_opts: ClientOptions): Client<T> {
  // TODO: build a proxy that POSTs to `${url}/<dotted.name>` and parses the result.
  return new Proxy({}, {}) as Client<T>;
}
