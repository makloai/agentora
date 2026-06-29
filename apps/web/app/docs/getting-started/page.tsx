import type { Metadata } from 'next';
import { DocPager } from '@/components/doc-pager';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Getting started',
  description:
    'Install agentora, define a contract, implement it server-side, create the app, and expose every surface.',
  path: '/docs/getting-started',
});

export default function GettingStarted() {
  return (
    <>
      <article className="prose">
        <h1>Getting started</h1>

        <h2>Install</h2>
        <pre>
          <code>{`pnpm add @agentora/core @agentora/server
# then add only the surfaces you need:
pnpm add @agentora/mcp @agentora/ai-sdk @agentora/openai @agentora/http @agentora/client @agentora/cli @agentora/doctor`}</code>
        </pre>
        <p>
          <code>@agentora/core</code> is isomorphic and zero-dependency — safe
          in a browser or edge bundle. Handlers live in{' '}
          <code>@agentora/server</code> and never ship to the client.
        </p>

        <h2>1. Define a contract</h2>
        <p>
          A contract is pure data: a name, metadata, and{' '}
          <code>input</code>/<code>output</code> schemas. No handler.
        </p>
        <pre>
          <code>{`import { defineContract, s } from '@agentora/core'

export const searchProducts = defineContract({
  name: 'products.search',
  description: 'Search the catalog.',
  sideEffects: 'read',
  input: s.object({ query: s.string().min(1), limit: s.number().default(10) }),
  output: s.object({ results: s.array(s.object({ id: s.string(), title: s.string() })) }),
})`}</code>
        </pre>
        <p>
          Use the built-in <code>s</code> builder (zero-install) or any Standard
          Schema library (Zod, Valibot, ArkType). Fields with{' '}
          <code>.default()</code> or <code>.optional()</code> may be omitted by
          callers.
        </p>

        <h2>2. Implement it (server-only)</h2>
        <pre>
          <code>{`import { implement } from '@agentora/server'

export const searchProductsImpl = implement(searchProducts, async ({ input, ctx, stream }) => {
  stream.log(\`searching \${input.query}\`)
  return { results: await ctx.catalog.search(input.query, input.limit) }
})`}</code>
        </pre>

        <h2>3. Create the app</h2>
        <pre>
          <code>{`import { createApp, router } from '@agentora/server'
import { trace, auth, idempotency } from '@agentora/server/middleware'

export const app = createApp({
  router: router({ products: { search: searchProductsImpl } }),
  context: async (req) => ({ catalog, user: await getUser(req) }),
  use: [trace(), auth(), idempotency()],
})`}</code>
        </pre>

        <h2>4. Expose surfaces</h2>
        <pre>
          <code>{`import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)`}</code>
        </pre>

        <h2>5. Call it from a typed client</h2>
        <pre>
          <code>{`import { createClient } from '@agentora/client'
import type { contracts } from './contracts'

const client = createClient<typeof contracts>({ url: '/api' })
await client.products.search({ query: 'shoes' }) // typed, no server code`}</code>
        </pre>

        <h2>6. Check agent-readiness</h2>
        <pre>
          <code>npx agentora doctor</code>
        </pre>
      </article>

      <DocPager href="/docs/getting-started" />
    </>
  );
}
