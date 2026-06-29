// @agentora/server/store — the pluggable backend behind stateful middleware
// (idempotency replay, etc.). v1 ships an in-memory implementation; the seam
// lets a Redis/DB store drop in later without touching middleware. (KTD3)

export interface Store<V = unknown> {
  get(key: string): Promise<V | undefined> | V | undefined;
  set(key: string, value: V): Promise<void> | void;
  has(key: string): Promise<boolean> | boolean;
}

/** A process-local, unbounded in-memory store. The default for every middleware. */
export function memoryStore<V = unknown>(): Store<V> {
  const map = new Map<string, V>();
  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    has: (key) => map.has(key),
  };
}
