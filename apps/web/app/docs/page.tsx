import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPager } from '@/components/doc-pager';
import { docsPages } from '@/lib/docs';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Documentation',
  description:
    'agentora documentation — install, define a contract, expose surfaces, and score agent-readiness.',
  path: '/docs',
});

export default function DocsIndex() {
  return (
    <>
      <article className="prose">
        <h1>Documentation</h1>
        <p>
          <strong>agentora</strong> lets you define an application capability{' '}
          <strong>once</strong> as a typed <em>contract</em>, then expose it to
          every agent-facing surface — MCP, Vercel AI SDK / OpenAI tool specs,
          HTTP, CLI, React hooks, and a typed client — without re-implementing
          validation, auth, or error handling per surface.
        </p>
        <p>
          agentora is a <em>capability layer</em>, not an agent framework. It is
          deliberately unopinionated about orchestration, prompts, memory, and
          long-running workflows — those stay application-level. Its job is to
          make the capabilities you already have{' '}
          <strong>agent-ready by construction</strong>.
        </p>

        <h2>At a glance</h2>
        <pre>
          <code>{`// contracts/products.ts — pure, isomorphic, shippable anywhere
import { defineContract, s } from '@agentora/core'

export const searchProducts = defineContract({
  name: 'products.search',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ results: s.array(productSchema) }),
})`}</code>
        </pre>
        <pre>
          <code>{`// surfaces.ts — each adapter is its own import
import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)`}</code>
        </pre>
      </article>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {docsPages
          .filter((p) => p.slug !== '')
          .map((page) => (
            <Link
              className="group rounded-xl border border-border p-5 transition-colors hover:border-primary/40 hover:bg-card"
              href={page.href}
              key={page.href}
            >
              <div className="font-medium text-foreground group-hover:text-primary">
                {page.title}
              </div>
              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                {page.description}
              </p>
            </Link>
          ))}
      </div>

      <DocPager href="/docs" />
    </>
  );
}
