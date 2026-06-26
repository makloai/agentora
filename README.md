# agentora

**One contract, every agent surface.**

Define an application capability **once** as a typed *contract*, then expose it to every agent-facing surface — MCP, Vercel AI SDK / OpenAI tool specs, HTTP, CLI, React hooks, and a typed client — without re-implementing validation, auth, or error handling per surface.

agentora is a *capability layer*, not an agent framework. It's deliberately unopinionated about orchestration, prompts, memory, and long-running workflows — those stay application-level. Its job is to make the capabilities you already have **agent-ready by construction**: explicit contracts and reviewable surfaces.

> Status: 🚧 early scaffold. The package layout and API below are the target shape; implementations are being filled in. See [milestones](#milestones).

## The idea

Exposing one capability (search products, create an invoice, look up an account) to agents usually means re-implementing it N times — a CLI command, an HTTP route, an MCP tool, a tool spec, a typed client — each with its own validation, error shapes, and auth assumptions. They drift, and production concerns (permissions, idempotency, concurrency, cancellation, redaction) get re-solved per surface or skipped.

agentora derives every surface from a single contract.

## Design: contract-first

The contract is **split from its implementation**. A contract is pure, isomorphic, and zero-dependency, so it can ship to a browser, an edge runtime, or a separate client repo. The handler — which imports your DB and services — lives separately and only runs server-side.

```ts
// contracts/products.ts — pure, isomorphic, shippable anywhere
import { defineContract, s } from '@agentora/core'

export const searchProducts = defineContract({
  name: 'products.search',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ results: s.array(productSchema) }),
})
```

```ts
// server/products.ts — server-only, imports your DB
import { implement } from '@agentora/server'
import { searchProducts } from '../contracts/products'

export const searchProductsImpl = implement(searchProducts,
  async ({ input, ctx, stream }) => {
    stream.log(`searching ${input.query}`)
    return { results: await ctx.catalog.search(input.query, input.limit) }
  })
```

```ts
// app.ts — the single entry point
import { createApp, router } from '@agentora/server'
import { trace, auth, idempotency } from '@agentora/server/middleware'

export const app = createApp({
  router: router({ products: { search: searchProductsImpl } }),
  context: async (req) => ({ catalog, user: await getUser(req) }),
  use: [trace(), auth(), idempotency()],
})
```

```ts
// surfaces.ts — app stays surface-agnostic; each adapter is its own import
import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)
```

```ts
// client.ts — built from CONTRACTS only; safe in a browser bundle
import { createClient } from '@agentora/client'
import type { contracts } from './contracts'

export const client = createClient<typeof contracts>({ url: '/api' })
// client.products.search({ query: 'shoes' })  ← typed, zero server code
```

A one-line `defineAction` convenience (contract + impl fused) is available for trivial single-file cases — but the recommended path is the split, because that's what unlocks edge / browser / multi-repo use.

## Agent-readiness `doctor`

agentora's headline feature: it tells you how agent-ready your actions are.

```
$ npx agentora doctor
  ✓ products.search   ready
  ⚠ invoices.create   no permission hook
  ✗ accounts.delete   no idempotency key, unbounded concurrency
  Agent-readiness: 72/100
```

## Packages

| Package | Purpose |
| --- | --- |
| `@agentora/core` | `defineContract`, `s` (Standard Schema), `router`, manifest IR + JSON Schema compiler, error taxonomy. **Isomorphic, zero-dep.** |
| `@agentora/server` | `createApp`, `implement`, runtime (validate → middleware → handler), streaming, idempotency / concurrency / cancellation, context factory. Node + edge. |
| `@agentora/mcp` | MCP server adapter (stdio + HTTP). |
| `@agentora/ai-sdk` | Vercel AI SDK tool adapter. |
| `@agentora/openai` | OpenAI Chat + Responses tool specs. |
| `@agentora/http` | Fetch-style HTTP handler with structured error codes. |
| `@agentora/cli` | CLI adapter from contracts. |
| `@agentora/client` | Typed client (+ `/react` hooks), built from contracts only. |
| `@agentora/doctor` | Agent-readiness linter / score over the manifest IR. |
| `agentora` | CLI bin: `dev`, `doctor`, `gen`. |

Each adapter takes the app/router as input and is independently installable — you only add the surfaces you use.

## Milestones

1. `@agentora/core` — contract, schema, router, manifest IR.
2. `@agentora/server` — runtime, middleware, context, streaming.
3. First two adapters — `@agentora/mcp` + `@agentora/ai-sdk`.
4. `@agentora/doctor` — the readiness score.
5. Remaining surfaces — `http`, `client`/`react`, `cli`, `openai`.
6. OSS polish — docs (agentora.dev), examples, npm publish, CI.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
