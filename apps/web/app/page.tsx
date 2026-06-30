import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { CodeCard } from '@/components/code-card';
import { Faq } from '@/components/faq';
import { JsonLd } from '@/components/json-ld';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { faq, packages, site, surfaces } from '@/lib/site';

const contractCode = `// contracts/products.ts — pure, isomorphic, shippable anywhere
import { defineContract, s } from '@agentora/core'

export const searchProducts = defineContract({
  name: 'products.search',
  sideEffects: 'read',
  input: s.object({ query: s.string(), limit: s.number().default(10) }),
  output: s.object({ results: s.array(productSchema) }),
})`;

const serverCode = `// server/products.ts — server-only, imports your DB
import { implement } from '@agentora/server'

export const searchProductsImpl = implement(searchProducts,
  async ({ input, ctx, stream }) => {
    stream.log(\`searching \${input.query}\`)
    return { results: await ctx.catalog.search(input.query) }
  })`;

const surfacesCode = `// surfaces.ts — app stays surface-agnostic; one import each
import { toMcp } from '@agentora/mcp'
import { aiSdkTools } from '@agentora/ai-sdk'
import { toFetchHandler } from '@agentora/http'

export const mcp   = toMcp(app)
export const tools = aiSdkTools(app)
export default       toFetchHandler(app)`;

const doctorOutput = `$ npx agentora doctor
  ✓ products.search   ready
  ⚠ invoices.create   no permission hook
  ✗ accounts.delete   no idempotency key, unbounded concurrency
  Agent-readiness: 72/100`;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-muted-foreground text-xs">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: site.name,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web',
          description: site.description,
          url: site.url,
          license: 'https://opensource.org/licenses/MIT',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />

      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <div className="grid-backdrop pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="mb-6 flex justify-center">
            <Pill>
              <span className="size-1.5 rounded-full bg-primary" />
              {site.version} · open source · {site.license}
            </Pill>
          </div>
          <h1 className="mx-auto max-w-4xl text-balance font-semibold text-5xl text-foreground tracking-tight sm:text-6xl md:text-7xl">
            One contract,
            <br />
            <span className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-300">
              every agent surface.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
            Define an application capability{' '}
            <span className="text-foreground">once</span> as a typed contract,
            then expose it to MCP, the Vercel AI SDK, OpenAI, HTTP, a CLI, and a
            typed client — without re-implementing validation, auth, or error
            handling per surface.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90"
              href={site.github}
              rel="noreferrer"
              target="_blank"
            >
              Star on GitHub <ArrowRight className="size-4" />
            </a>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-medium text-foreground text-sm transition-colors hover:bg-card"
              href="/docs"
            >
              Read the docs
            </Link>
          </div>

          <code className="mt-6 inline-block rounded-xl border border-border bg-card px-5 py-3 font-mono text-muted-foreground text-sm">
            <span className="text-muted-foreground/60">$ </span>npm i
            @agentora/core @agentora/server
          </code>

          <p className="mt-6 text-muted-foreground text-sm">
            A <span className="text-foreground">capability layer</span>, not an
            agent framework — unopinionated about orchestration, prompts, and
            memory.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-semibold text-2xl text-foreground sm:text-3xl">
          Stop re-implementing the same capability N times.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground leading-relaxed">
          Exposing one capability to agents usually means a CLI command, an HTTP
          route, an MCP tool, a tool spec, and a typed client — each with its own
          validation, error shapes, and auth. They drift, and production concerns
          get re-solved per surface or skipped. {site.name} derives every surface
          from a single contract.
        </p>
      </section>

      {/* Code: contract-first */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="font-semibold text-2xl text-foreground sm:text-3xl">
            Contract-first by design
          </h2>
          <p className="mt-3 text-muted-foreground">
            The pure contract ships anywhere. The handler stays server-side.
            Surfaces are adapters.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <CodeCard code={contractCode} title="contracts/products.ts" />
          <CodeCard code={serverCode} title="server/products.ts" />
          <CodeCard code={surfacesCode} title="surfaces.ts" />
        </div>
      </section>

      {/* Surfaces */}
      <section className="mx-auto max-w-6xl px-6 py-16" id="surfaces">
        <div className="mb-10 text-center">
          <h2 className="font-semibold text-2xl text-foreground sm:text-3xl">
            Every surface, one source
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each adapter is independently installable — add only the surfaces you
            use.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map(({ name, desc, icon: Icon }) => (
            <div
              className="group rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:border-primary/40 hover:bg-card"
              key={name}
            >
              <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-medium text-foreground">{name}</h3>
              <p className="mt-1 text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctor */}
      <section className="mx-auto max-w-6xl px-6 py-16" id="doctor">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-primary text-sm">
              <ShieldCheck className="size-4" /> The headline feature
            </div>
            <h2 className="font-semibold text-2xl text-foreground sm:text-3xl">
              Know how agent-ready you are.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-sm">
                agentora doctor
              </code>{' '}
              lints your manifest for what agents actually need — declared
              idempotency on writes, permission hooks, bounded concurrency,
              descriptions — and scores it. Wire it into CI to gate readiness.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-1.5 font-medium text-primary text-sm hover:underline"
              href="/docs/doctor"
            >
              How the score works <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <CodeCard code={doctorOutput} title="terminal" />
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-card/40 p-10 text-center">
          <h2 className="font-semibold text-2xl text-foreground">
            Nine packages. Install what you need.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {packages.map((p) => (
              <span
                className="rounded-lg border border-border bg-muted px-3 py-1.5 font-mono text-foreground text-xs"
                key={p}
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-9">
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90"
              href="/docs/getting-started"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center font-semibold text-2xl text-foreground sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-10">
          <Faq items={faq} />
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card px-8 py-14 text-center sm:px-12">
          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5">
            <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
              Make your capabilities agent-ready by construction.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              One typed contract, every surface, and a readiness score you can
              gate in CI. Open source under {site.license}.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90"
                href={site.github}
                rel="noreferrer"
                target="_blank"
              >
                Star on GitHub <ArrowRight className="size-4" />
              </a>
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-6 py-3 font-medium text-foreground text-sm transition-colors hover:bg-card"
                href="/docs"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
