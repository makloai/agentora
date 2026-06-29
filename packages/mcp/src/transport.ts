// @agentora/mcp/transport — transport selection for the MCP server.
// stdio is zero-config; Streamable HTTP is exposed for callers that own an HTTP
// server (and layer @agentora/mcp/oauth in front of it).

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

/** Connect the server over stdio (the default when launched as a subprocess). */
export async function startStdio(server: Server): Promise<StdioServerTransport> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return transport;
}

export interface StreamableHttpOptions {
  /** Stateless mode skips session-id management; good for simple deployments. */
  stateless?: boolean;
}

/**
 * Create and connect a Streamable HTTP transport. The caller drives it with the
 * incoming request/response objects from its own HTTP server.
 */
export async function connectStreamableHttp(
  server: Server,
  opts: StreamableHttpOptions = {}
): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: opts.stateless ? undefined : () => crypto.randomUUID(),
  });
  await server.connect(transport);
  return transport;
}
