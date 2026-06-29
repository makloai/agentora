# @agentora/example-basic

A runnable dogfood of the README walkthrough: **one contract, every surface.**

- `src/contracts/products.ts` — pure contracts (`products.search`, `orders.create`).
- `src/server/products.ts` — server-only handlers over an in-memory catalog.
- `src/app.ts` — `createApp` with the full middleware stack (trace, auth, idempotency, concurrency, redact).
- `src/surfaces.ts` — MCP, AI SDK, OpenAI, and HTTP surfaces, each its own import.
- `src/client.ts` — the typed client, built from contracts only.
- `test/e2e.test.ts` — exercises a read + a write action end-to-end through the HTTP handler and typed client, checks MCP/AI-SDK/OpenAI tool parity, and asserts a 100/100 doctor score.

```bash
pnpm --filter @agentora/example-basic test
pnpm --filter @agentora/example-basic typecheck
```

This example is also the end-to-end smoke run in CI.
