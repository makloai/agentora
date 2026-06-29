# Packages

| Package | Purpose | Key exports |
| --- | --- | --- |
| `@agentora/core` | Contracts, the `s` schema builder, router, manifest IR, JSON Schema compiler, error taxonomy. Isomorphic, zero-dep. | `defineContract`, `router`, `s`, `toManifest`, `toJsonSchema`, `toStrictJsonSchema`, `resolveJsonSchema`, `registerVendorConverter`, `AgentoraError` |
| `@agentora/server` | Runtime (validate → middleware → handler → validate), `createApp`, `implement`, `defineAction`, streaming, context. | `createApp`, `implement`, `defineAction`, `router`, `AnyApp` |
| `@agentora/server/middleware` | Cross-cutting middleware + the pluggable store. | `trace`, `auth`, `idempotency`, `concurrency`, `retry`, `redact`, `memoryStore` |
| `@agentora/mcp` | MCP server adapter (stdio + Streamable HTTP) over the low-level `Server`. | `toMcp`, `createServer`, `listTools`, `callTool` |
| `@agentora/mcp/oauth` | OAuth 2.1 resource-server protection for the MCP HTTP transport. | `oauthResourceServer`, `protectedResourceMetadata` |
| `@agentora/ai-sdk` | Vercel AI SDK tool adapter. | `aiSdkTools` |
| `@agentora/openai` | OpenAI Chat + Responses tool specs. | `openaiChatTools`, `openaiResponsesTools` |
| `@agentora/http` | Fetch-style HTTP handler with structured error codes + discovery. | `toFetchHandler` |
| `@agentora/client` | Typed client built from contracts only. Browser-safe. | `createClient` |
| `@agentora/client/react` | React hooks over the typed client. | `useAction` |
| `@agentora/cli` | CLI adapter + the `agentora` bin (`dev`/`doctor`/`gen`). | `toCli`, `manifestJson` |
| `@agentora/doctor` | Agent-readiness linter / score over the manifest. | `doctor`, `RULES` |

## Error taxonomy

All surfaces share `AgentoraError` with a typed `code`: `VALIDATION`, `UNAUTHENTICATED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `CANCELLED`, `INTERNAL`. Each adapter
maps these to its own shape — HTTP status, MCP `isError`, a rejected client promise.
