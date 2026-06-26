# AGENTS.md

A guide for AI coding agents working in the **agentora** repo.

## What this is

agentora is an open-source TypeScript SDK: **one contract, every agent surface.** Define a capability once as a typed contract; generate MCP / AI SDK / OpenAI / HTTP / CLI / React / typed-client surfaces from it. See `README.md` for the full pitch and target API.

## Core design rules

- **Contracts are pure and isomorphic.** `@agentora/core` has zero runtime/Node dependencies. A contract (`defineContract`) carries `name`, `description`, `sideEffects`, `idempotency`, `input`, `output` — and **never** a handler. It must be safe to import in a browser or edge bundle.
- **Implementations are server-only.** `implement(contract, handler)` lives in `@agentora/server`. Handlers may import DB/services; contracts may not.
- **Surfaces are adapters, not methods.** Each adapter package exports a function `(app) => surface`. Adding a surface must not pull other surfaces into the bundle.
- **Cross-cutting concerns are middleware.** Auth, idempotency, concurrency, retries, redaction, tracing compose as typed middleware in `@agentora/server`; per-contract metadata (`sideEffects`, `idempotency`) is data the middleware and `doctor` read.
- **The manifest IR is the source of truth for tooling.** Contracts compile to a JSON-serializable manifest (name, description, JSON Schema in/out, auth, sideEffects). `@agentora/doctor`, discovery (`/.well-known/actions.json`), and external clients consume the manifest.
- **Runtime-agnostic.** Standardize streaming on Web Streams / async generators so adapters run on Node and Cloudflare Workers.

## Layout

```
packages/
  core/      defineContract, s (Standard Schema), router, manifest IR  — isomorphic, zero-dep
  server/    createApp, implement, runtime, middleware, context        — Node + edge
  mcp/       MCP adapter
  ai-sdk/    Vercel AI SDK adapter
  openai/    OpenAI tool specs
  http/      fetch-style HTTP handler
  cli/       CLI adapter + the `agentora` bin
  client/    typed client (+ /react)
  doctor/    agent-readiness linter / score
examples/    dogfood + demos
```

## Setup

Node >=20, pnpm 11.1.2.

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Conventions

- ESM-only. TypeScript. Biome for lint/format (`pnpm lint` / `pnpm fix`).
- Inline type imports; named exports for utilities.
- Every package builds with tsup to `dist/` and ships types.
