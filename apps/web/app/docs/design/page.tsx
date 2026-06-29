import type { Metadata } from 'next';
import { DocPager } from '@/components/doc-pager';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Design',
  description:
    'The contract-first split, the JSON-serializable manifest IR, typed middleware, and how every surface is an adapter over a single source of truth.',
  path: '/docs/design',
});

export default function Design() {
  return (
    <>
      <article className="prose">
        <h1>Design</h1>

        <h2>Contract-first split</h2>
        <p>
          A <strong>contract</strong> is split from its{' '}
          <strong>implementation</strong>:
        </p>
        <ul>
          <li>
            The contract is pure, isomorphic, and zero-dependency. It carries{' '}
            <code>name</code>, <code>description</code>,{' '}
            <code>sideEffects</code>, <code>idempotency</code>, optional{' '}
            <code>auth</code>/<code>concurrency</code> metadata, and{' '}
            <code>input</code>/<code>output</code> schemas — but{' '}
            <strong>never</strong> a handler. It can ship to a browser, an edge
            runtime, or a separate client repo.
          </li>
          <li>
            The implementation (<code>implement(contract, handler)</code>) lives
            server-side and may import your DB and services.
          </li>
        </ul>
        <p>
          A one-line <code>defineAction</code> fuses the two for trivial
          single-file cases; it splits the contract back out pure, so the
          isomorphic guarantee holds either way.
        </p>

        <h2>The manifest IR</h2>
        <p>
          Every contract compiles to a JSON-serializable{' '}
          <strong>manifest</strong>: per action a <code>name</code>,{' '}
          <code>description</code>, <code>sideEffects</code>,{' '}
          <code>idempotency</code>, optional <code>auth</code>/
          <code>concurrency</code>, and JSON Schema for <code>input</code>/
          <code>output</code> (draft 2020-12). The manifest is the single source
          of truth that every surface and the <code>doctor</code> read.
        </p>
        <p>
          Schema compilation is tiered (Standard Schema exposes only{' '}
          <code>validate()</code> at runtime, so a universal converter is
          impossible):
        </p>
        <ol>
          <li>
            the built-in <code>s</code> builder compiles directly (it owns its
            structure);
          </li>
          <li>
            any schema implementing the <code>~standard.jsonSchema</code>{' '}
            companion spec is used as-is;
          </li>
          <li>a registered per-vendor converter handles the rest;</li>
          <li>otherwise resolution fails loudly with guidance.</li>
        </ol>
        <p>
          A <code>toStrictJsonSchema()</code> transform derives the OpenAI
          Structured-Outputs variant (<code>additionalProperties: false</code>,
          all-required, null-union optionals).
        </p>

        <h2>Middleware</h2>
        <p>
          Cross-cutting concerns compose as typed middleware in{' '}
          <code>@agentora/server</code>: <code>trace</code>, <code>auth</code>,{' '}
          <code>idempotency</code>, <code>concurrency</code>, <code>retry</code>,{' '}
          <code>redact</code>. They run as an onion around the handler: input is
          validated first, then middleware, then the handler, then output
          validation. Per-contract metadata (<code>sideEffects</code>,{' '}
          <code>idempotency</code>, <code>auth</code>, <code>concurrency</code>)
          is data the middleware and <code>doctor</code> read. Stateful
          middleware take a pluggable <code>Store</code> (in-memory by default).
        </p>

        <h2>Surfaces are adapters</h2>
        <p>
          Each surface is a function <code>(app) =&gt; surface</code>,
          independently installable. Adding one surface never pulls another into
          your bundle. The runtime standardizes streaming on Web Streams / async
          generators and threads an <code>AbortSignal</code>, so adapters run on
          Node and edge runtimes alike.
        </p>
        <pre>
          <code>{`defineContract
   │
   ▼
manifest IR ──┬──▶ MCP tools
              ├──▶ AI SDK tools
              ├──▶ OpenAI specs
              ├──▶ HTTP handler
              └──▶ doctor score`}</code>
        </pre>
      </article>

      <DocPager href="/docs/design" />
    </>
  );
}
