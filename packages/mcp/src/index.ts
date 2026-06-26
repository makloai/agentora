// @agentora/mcp — expose an agentora app as an MCP server (stdio + HTTP).
import type { App } from '@agentora/server';

export interface McpOptions {
  /** Auto-detect stdio when launched as an MCP subprocess. */
  transport?: 'stdio' | 'http' | 'auto';
}

/** Build an MCP server from an app. Tool names come from the router tree namespacing. */
export function toMcp(_app: App, _opts: McpOptions = {}) {
  // TODO: read the manifest IR, register one MCP tool per contract, wire OAuth 2.1
  // (Better Auth) for the HTTP transport, stream handler events as MCP progress.
  return {
    async start() {
      /* TODO */
    },
  };
}
