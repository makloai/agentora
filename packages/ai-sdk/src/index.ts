// @agentora/ai-sdk — expose an agentora app as Vercel AI SDK tools.
import type { App } from '@agentora/server';

/** Produce a record of AI SDK tools keyed by dotted action name. */
export function aiSdkTools(_app: App): Record<string, unknown> {
  // TODO: map each contract to an AI SDK `tool({ description, inputSchema, execute })`,
  // compiling input via the manifest IR and invoking the app through its middleware.
  return {};
}
