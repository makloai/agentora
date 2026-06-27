// @agentora/ai-sdk — expose an agentora app as Vercel AI SDK tools.
// Each contract becomes a `tool({ description, inputSchema, execute })` keyed by
// its dotted action name; the input schema is the contract's JSON Schema wrapped
// in `jsonSchema()`, and `execute` runs the action through the app's middleware.

import { type JsonSchema, toStrictJsonSchema } from '@agentora/core';
import type { AnyApp } from '@agentora/server';
import { type Tool, jsonSchema, tool } from 'ai';

/** Produce a record of AI SDK tools keyed by dotted action name. */
export function aiSdkTools(app: AnyApp): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  for (const action of app.manifest().actions) {
    tools[action.name] = tool({
      description: action.description,
      inputSchema: jsonSchema(toStrictJsonSchema(action.input as JsonSchema)),
      execute: (input, options) => app.invoke(action.name, input, { signal: options.abortSignal }),
    });
  }
  return tools;
}
