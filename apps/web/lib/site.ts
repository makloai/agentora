import {
  Boxes,
  GitBranch,
  Layers,
  type LucideIcon,
  Plug,
  Sparkles,
  Terminal,
} from 'lucide-react';

/** Single source of truth for site-wide identity, links, and navigation. */
export const site = {
  name: 'agentora',
  tagline: 'One contract, every agent surface.',
  description:
    'Define an application capability once as a typed contract, then expose it to every agent surface — MCP, AI SDK, OpenAI, HTTP, CLI, and a typed client — with no per-surface re-implementation.',
  url: 'https://agentora.dev',
  github: 'https://github.com/makloai/agentora',
  npm: 'https://www.npmjs.com/package/@agentora/core',
  license: 'MIT',
  version: 'v0.1',
} as const;

export const nav = [
  { href: '/docs', label: 'Docs' },
  { href: '/#surfaces', label: 'Surfaces' },
  { href: '/#doctor', label: 'Doctor' },
] as const;

export const surfaces: { name: string; desc: string; icon: LucideIcon }[] = [
  { name: 'MCP', desc: 'stdio + Streamable HTTP, OAuth 2.1', icon: Plug },
  { name: 'Vercel AI SDK', desc: 'typed tool() definitions', icon: Sparkles },
  { name: 'OpenAI', desc: 'Chat + Responses tool specs', icon: Boxes },
  { name: 'HTTP', desc: 'fetch handler + discovery', icon: GitBranch },
  { name: 'CLI', desc: 'one subcommand per action', icon: Terminal },
  { name: 'Typed client', desc: 'browser-safe, + React hooks', icon: Layers },
];

export const packages = [
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

export const faq = [
  {
    question: 'Is agentora an agent framework?',
    answer:
      'No. agentora is a capability layer, not an agent framework. It is deliberately unopinionated about orchestration, prompts, memory, and long-running workflows — those stay application-level. Its job is to make the capabilities you already have agent-ready by construction.',
  },
  {
    question: 'What does “one contract, every surface” actually mean?',
    answer:
      'You define a capability once as a pure, typed contract. agentora compiles it to a JSON manifest, and every surface — MCP, the Vercel AI SDK, OpenAI tool specs, HTTP, a CLI, and a typed client — is derived from that single manifest. Validation, error shapes, and auth are defined once instead of per surface.',
  },
  {
    question: 'Do I have to install all nine packages?',
    answer:
      'No. @agentora/core and @agentora/server are the foundation; every surface adapter is independently installable. Add only the surfaces you actually expose — installing one never pulls another into your bundle.',
  },
  {
    question: 'Can contracts ship to the browser?',
    answer:
      'Yes. A contract is pure, isomorphic, and zero-dependency — it carries only metadata and input/output schemas, never a handler. It can ship to a browser, an edge runtime, or a separate client repo. The implementation lives server-side and never reaches the client.',
  },
  {
    question: 'What is the doctor?',
    answer:
      'agentora doctor is the headline feature: it lints your manifest for what agents actually need — declared idempotency on writes, permission hooks, bounded concurrency, descriptions — and scores agent-readiness from 0 to 100. The score is deterministic and monotonic, and the CLI exits non-zero on any error, so you can gate readiness in CI.',
  },
];
