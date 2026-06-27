# agentora

**One contract, every agent surface.**

Define an application capability **once** as a typed *contract*, then expose it to every
agent-facing surface — MCP, Vercel AI SDK / OpenAI tool specs, HTTP, CLI, React hooks, and a
typed client — without re-implementing validation, auth, or error handling per surface.

agentora is a *capability layer*, not an agent framework. It is deliberately unopinionated
about orchestration, prompts, memory, and long-running workflows — those stay
application-level. Its job is to make the capabilities you already have **agent-ready by
construction**.

## Pages

- [Getting started](./getting-started.md) — install, define a contract, expose surfaces.
- [Design](./design.md) — contract-first split, the manifest IR, middleware, surfaces.
- [Packages](./packages.md) — per-package reference.
- [Agent-readiness doctor](./doctor.md) — the readiness score and its rules.

> Docs tooling (VitePress/Astro/agentora.dev) is intentionally deferred — these pages are
> plain Markdown and render anywhere. Wiring a static-site generator is a follow-up that
> consumes this content unchanged.

## At a glance

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
// surfaces.ts — each adapter is its own import
import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)
```

A runnable version lives in [`examples/basic`](../../examples/basic).
