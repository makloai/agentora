---
"@agentora/core": minor
"@agentora/server": minor
"@agentora/mcp": minor
"@agentora/ai-sdk": minor
"@agentora/openai": minor
"@agentora/http": minor
"@agentora/cli": minor
"@agentora/client": minor
"@agentora/doctor": minor
---

Initial implementation of agentora — one contract, every agent surface.

- **core**: `defineContract`, the `s` schema builder, `router`, the manifest IR, a draft-2020-12 JSON Schema compiler with an OpenAI-strict variant, the tiered BYO-schema resolver, and the shared error taxonomy.
- **server**: the execution runtime (validate → middleware → handler → validate), `createApp`/`implement`/`defineAction`, real `trace`/`auth`/`idempotency`/`concurrency`/`retry`/`redact` middleware over a pluggable store, context, streaming, and cancellation.
- **surfaces**: MCP (stdio + Streamable HTTP, OAuth 2.1 resource server), Vercel AI SDK tools, OpenAI Chat + Responses specs, a fetch-style HTTP handler with discovery, a typed browser-safe client (+ React hooks), and a CLI with the `agentora` bin.
- **doctor**: an agent-readiness score over the manifest.
