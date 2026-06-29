import type { Metadata } from 'next';
import { DocPager } from '@/components/doc-pager';
import { pageMetadata } from '@/lib/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'Packages',
  description:
    'Per-package reference for agentora — core, server, every surface adapter, the CLI and doctor, plus the shared error taxonomy.',
  path: '/docs/packages',
});

const rows: { pkg: string; purpose: string; exports: string }[] = [
  {
    pkg: '@agentora/core',
    purpose:
      'Contracts, the s schema builder, router, manifest IR, JSON Schema compiler, error taxonomy. Isomorphic, zero-dep.',
    exports:
      'defineContract, router, s, toManifest, toJsonSchema, toStrictJsonSchema, resolveJsonSchema, registerVendorConverter, AgentoraError',
  },
  {
    pkg: '@agentora/server',
    purpose:
      'Runtime (validate → middleware → handler → validate), createApp, implement, defineAction, streaming, context.',
    exports: 'createApp, implement, defineAction, router, AnyApp',
  },
  {
    pkg: '@agentora/server/middleware',
    purpose: 'Cross-cutting middleware + the pluggable store.',
    exports: 'trace, auth, idempotency, concurrency, retry, redact, memoryStore',
  },
  {
    pkg: '@agentora/mcp',
    purpose: 'MCP server adapter (stdio + Streamable HTTP) over the low-level Server.',
    exports: 'toMcp, createServer, listTools, callTool',
  },
  {
    pkg: '@agentora/mcp/oauth',
    purpose: 'OAuth 2.1 resource-server protection for the MCP HTTP transport.',
    exports: 'oauthResourceServer, protectedResourceMetadata',
  },
  {
    pkg: '@agentora/ai-sdk',
    purpose: 'Vercel AI SDK tool adapter.',
    exports: 'aiSdkTools',
  },
  {
    pkg: '@agentora/openai',
    purpose: 'OpenAI Chat + Responses tool specs.',
    exports: 'openaiChatTools, openaiResponsesTools',
  },
  {
    pkg: '@agentora/http',
    purpose: 'Fetch-style HTTP handler with structured error codes + discovery.',
    exports: 'toFetchHandler',
  },
  {
    pkg: '@agentora/client',
    purpose: 'Typed client built from contracts only. Browser-safe.',
    exports: 'createClient',
  },
  {
    pkg: '@agentora/client/react',
    purpose: 'React hooks over the typed client.',
    exports: 'useAction',
  },
  {
    pkg: '@agentora/cli',
    purpose: 'CLI adapter + the agentora bin (dev/doctor/gen).',
    exports: 'toCli, manifestJson',
  },
  {
    pkg: '@agentora/doctor',
    purpose: 'Agent-readiness linter / score over the manifest.',
    exports: 'doctor, RULES',
  },
];

export default function Packages() {
  return (
    <>
      <article className="prose">
        <h1>Packages</h1>
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Purpose</th>
              <th>Key exports</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pkg}>
                <td>
                  <code>{row.pkg}</code>
                </td>
                <td>{row.purpose}</td>
                <td>
                  <code>{row.exports}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Error taxonomy</h2>
        <p>
          All surfaces share <code>AgentoraError</code> with a typed{' '}
          <code>code</code>: <code>VALIDATION</code>,{' '}
          <code>UNAUTHENTICATED</code>, <code>FORBIDDEN</code>,{' '}
          <code>NOT_FOUND</code>, <code>CONFLICT</code>,{' '}
          <code>RATE_LIMITED</code>, <code>CANCELLED</code>,{' '}
          <code>INTERNAL</code>. Each adapter maps these to its own shape — HTTP
          status, MCP <code>isError</code>, a rejected client promise.
        </p>
      </article>

      <DocPager href="/docs/packages" />
    </>
  );
}
