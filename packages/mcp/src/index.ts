// @agentora/mcp — expose an agentora app as an MCP server (stdio + HTTP).
//
// Tool wire schemas come straight from the manifest IR (draft 2020-12), so we
// use the low-level `Server` and register raw tools/list + tools/call handlers
// rather than the high-level `registerTool` (which expects a Zod raw shape).

import { AgentoraError } from '@agentora/core';
import type { AnyApp } from '@agentora/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult as SdkCallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { startStdio } from './transport';

export interface McpOptions {
  /** Auto-detect stdio when launched as an MCP subprocess. */
  transport?: 'stdio' | 'http' | 'auto';
  name?: string;
  version?: string;
}

export interface McpToolSpec {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface CallToolResult {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/** One MCP tool spec per manifest action. */
export function listTools(app: AnyApp): McpToolSpec[] {
  return app.manifest().actions.map((action) => ({
    name: action.name,
    ...(action.description !== undefined ? { description: action.description } : {}),
    inputSchema: (action.input as Record<string, unknown>) ?? { type: 'object' },
    ...(action.output !== undefined
      ? { outputSchema: action.output as Record<string, unknown> }
      : {}),
  }));
}

export interface CallToolOptions {
  signal?: AbortSignal;
  /** Called with progress fractions when the caller supplied a progress token. */
  progress?: (fraction: number) => void;
}

/**
 * Execute one tool call. Unknown tools raise a protocol error (JSON-RPC);
 * execution failures — including input validation — come back as a tool result
 * with `isError: true` so the model can read the message and self-correct.
 */
export async function callTool(
  app: AnyApp,
  toolNames: ReadonlySet<string>,
  name: string,
  args: unknown,
  opts: CallToolOptions = {}
): Promise<CallToolResult> {
  if (!toolNames.has(name)) {
    throw new McpError(ErrorCode.InvalidParams, `unknown tool: ${name}`);
  }

  try {
    const output = await app.invoke(name, args ?? {}, {
      signal: opts.signal,
      stream: opts.progress
        ? { log: () => {}, artifact: () => {}, progress: opts.progress }
        : undefined,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent:
        output && typeof output === 'object'
          ? (output as Record<string, unknown>)
          : { value: output },
    };
  } catch (err) {
    if (err instanceof AgentoraError && err.code === 'NOT_FOUND') {
      throw new McpError(ErrorCode.InvalidParams, err.message);
    }
    return {
      content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
      isError: true,
    };
  }
}

/** Build a low-level MCP `Server` wired to the app's tools. */
export function createServer(app: AnyApp, opts: McpOptions = {}): Server {
  const server = new Server(
    { name: opts.name ?? 'agentora', version: opts.version ?? '0.0.0' },
    { capabilities: { tools: {} } }
  );
  const toolNames = new Set(app.manifest().actions.map((a) => a.name));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listTools(app) }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const progressToken = request.params._meta?.progressToken;
    const result = await callTool(app, toolNames, request.params.name, request.params.arguments, {
      signal: extra.signal,
      progress:
        progressToken !== undefined
          ? (fraction) => {
              void extra.sendNotification({
                method: 'notifications/progress',
                params: { progressToken, progress: fraction },
              });
            }
          : undefined,
    });
    return result as SdkCallToolResult;
  });

  return server;
}

/** Build an MCP server from an app and start it (stdio by default). */
export function toMcp(app: AnyApp, opts: McpOptions = {}) {
  const server = createServer(app, opts);
  return {
    server,
    async start() {
      // HTTP wiring is the caller's job (it owns the request/response objects and
      // the OAuth layer from @agentora/mcp/oauth); stdio is the zero-config default.
      await startStdio(server);
    },
  };
}
