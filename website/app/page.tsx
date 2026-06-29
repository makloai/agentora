import {
  ArrowRight,
  Boxes,
  GitBranch,
  Layers,
  Plug,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { CodeCard } from '@/components/code-card';

const GITHUB = 'https://github.com/makloai/agentora';
const NPM = 'https://www.npmjs.com/package/@agentora/core';

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

const surfaces = [
  { name: 'MCP', desc: 'stdio + Streamable HTTP, OAuth 2.1', icon: Plug },
  { name: 'Vercel AI SDK', desc: 'typed tool() definitions', icon: Sparkles },
  { name: 'OpenAI', desc: 'Chat + Responses tool specs', icon: Boxes },
  { name: 'HTTP', desc: 'fetch handler + discovery', icon: GitBranch },
  { name: 'CLI', desc: 'one subcommand per action', icon: Terminal },
  { name: 'Typed client', desc: 'browser-safe, + React hooks', icon: Layers },
];

const packages = [
  '@agentora/core',
  '@agentora/server',
  '@agentora/mcp',
  '@agentora/ai-sdk',
  '@agentora/openai',
  '@agentora/http',
  '@agentora/client',
  '@agentora/cli',
  '@agentora/doctor',
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-900/80 bg-[#09090b]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
            <span className="grid size-6 place-items-center rounded-md bg-emerald-500/15 text-emerald-400">
              ◆
            </span>
            agentora
          </a>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#surfaces" className="hidden hover:text-zinc-100 sm:block">
              Surfaces
            </a>
            <a href="#doctor" className="hidden hover:text-zinc-100 sm:block">
              Doctor
            </a>
            <a href={NPM} className="hover:text-zinc-100" target="_blank" rel="noreferrer">
              npm
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-100 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 grid-backdrop" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
          <div className="mb-6 flex justify-center">
            <Pill>
              <span className="size-1.5 rounded-full bg-emerald-400" />
              v0.1 · open source · MIT
            </Pill>
          </div>
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl md:text-7xl">
            One contract,
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
              every agent surface.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">
            Define an application capability <span className="text-zinc-200">once</span> as a typed
            contract, then expose it to MCP, the Vercel AI SDK, OpenAI, HTTP, a CLI, and a typed
            client — without re-implementing validation, auth, or error handling per surface.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Star on GitHub <ArrowRight className="size-4" />
            </a>
            <code className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-5 py-3 font-mono text-sm text-zinc-300">
              <span className="text-zinc-600">$ </span>npm i @agentora/core @agentora/server
            </code>
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            A <span className="text-zinc-300">capability layer</span>, not an agent framework —
            unopinionated about orchestration, prompts, and memory.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Stop re-implementing the same capability N times.
        </h2>
        <p className="mt-4 text-balance leading-relaxed text-zinc-400">
          Exposing one capability to agents usually means a CLI command, an HTTP route, an MCP tool,
          a tool spec, and a typed client — each with its own validation, error shapes, and auth.
          They drift, and production concerns get re-solved per surface or skipped. agentora derives
          every surface from a single contract.
        </p>
      </section>

      {/* Code: contract-first */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Contract-first by design</h2>
          <p className="mt-3 text-zinc-400">
            The pure contract ships anywhere. The handler stays server-side. Surfaces are adapters.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <CodeCard title="contracts/products.ts" code={contractCode} />
          <CodeCard title="server/products.ts" code={serverCode} />
          <CodeCard title="surfaces.ts" code={surfacesCode} />
        </div>
      </section>

      {/* Surfaces */}
      <section id="surfaces" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">Every surface, one source</h2>
          <p className="mt-3 text-zinc-400">
            Each adapter is independently installable — add only the surfaces you use.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map(({ name, desc, icon: Icon }) => (
            <div
              key={name}
              className="group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/40"
            >
              <div className="mb-4 grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Icon className="size-5" />
              </div>
              <h3 className="font-medium text-zinc-100">{name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctor */}
      <section id="doctor" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400">
              <ShieldCheck className="size-4" /> The headline feature
            </div>
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
              Know how agent-ready you are.
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-400">
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-sm text-zinc-200">
                agentora doctor
              </code>{' '}
              lints your manifest for what agents actually need — declared idempotency on writes,
              permission hooks, bounded concurrency, descriptions — and scores it. Wire it into CI to
              gate readiness.
            </p>
          </div>
          <CodeCard title="terminal" code={doctorOutput} />
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-10 text-center">
          <h2 className="text-2xl font-semibold text-zinc-100">Nine packages. Install what you need.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {packages.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 font-mono text-xs text-zinc-300"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-9">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Get started <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row">
          <span className="font-mono">◆ agentora · MIT</span>
          <div className="flex gap-6">
            <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-zinc-200">
              GitHub
            </a>
            <a href={NPM} target="_blank" rel="noreferrer" className="hover:text-zinc-200">
              npm
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
