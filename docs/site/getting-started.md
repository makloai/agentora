# Getting started

## Install

```bash
pnpm add @agentora/core @agentora/server
# then add only the surfaces you need:
pnpm add @agentora/mcp @agentora/ai-sdk @agentora/openai @agentora/http @agentora/client @agentora/cli @agentora/doctor
```

`@agentora/core` is isomorphic and zero-dependency — safe in a browser or edge bundle.
Handlers live in `@agentora/server` and never ship to the client.

## 1. Define a contract

A contract is pure data: a name, metadata, and `input`/`output` schemas. No handler.

```ts
import { defineContract, s } from '@agentora/core'

export const searchProducts = defineContract({
  name: 'products.search',
  description: 'Search the catalog.',
  sideEffects: 'read',
  input: s.object({ query: s.string().min(1), limit: s.number().default(10) }),
  output: s.object({ results: s.array(s.object({ id: s.string(), title: s.string() })) }),
})
```

Use the built-in `s` builder (zero-install) or any Standard Schema library (Zod, Valibot,
ArkType). Fields with `.default()` or `.optional()` may be omitted by callers.

## 2. Implement it (server-only)

```ts
import { implement } from '@agentora/server'

export const searchProductsImpl = implement(searchProducts, async ({ input, ctx, stream }) => {
  stream.log(`searching ${input.query}`)
  return { results: await ctx.catalog.search(input.query, input.limit) }
})
```

## 3. Create the app

```ts
import { createApp, router } from '@agentora/server'
import { trace, auth, idempotency } from '@agentora/server/middleware'

export const app = createApp({
  router: router({ products: { search: searchProductsImpl } }),
  context: async (req) => ({ catalog, user: await getUser(req) }),
  use: [trace(), auth(), idempotency()],
})
```

## 4. Expose surfaces

```ts
import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)
```

## 5. Call it from a typed client

```ts
import { createClient } from '@agentora/client'
import type { contracts } from './contracts'

const client = createClient<typeof contracts>({ url: '/api' })
await client.products.search({ query: 'shoes' }) // typed, no server code
```

## 6. Check agent-readiness

```bash
npx agentora doctor
```
