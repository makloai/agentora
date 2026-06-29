// @agentora/openai — emit OpenAI tool specs (Chat Completions + Responses).
// The `parameters` schema is byte-identical between the two surfaces; only the
// wrapper differs (Chat nests under `function`, Responses is flat). Both use the
// strict / Structured-Outputs variant of the contract's JSON Schema.

import { type JsonSchema, toStrictJsonSchema } from '@agentora/core';
import type { AnyApp } from '@agentora/server';

interface FunctionSpec {
  name: string;
  description?: string;
  parameters: JsonSchema;
  strict: true;
}

/** One strict function spec per action, in manifest order. */
function functionSpecs(app: AnyApp): FunctionSpec[] {
  return app.manifest().actions.map((action) => ({
    name: action.name,
    ...(action.description !== undefined ? { description: action.description } : {}),
    parameters: toStrictJsonSchema(action.input as JsonSchema),
    strict: true,
  }));
}

/** Chat Completions `tools` array — `parameters` nested under `function`. */
export function openaiChatTools(app: AnyApp): unknown[] {
  return functionSpecs(app).map((fn) => ({ type: 'function', function: fn }));
}

/** Responses API `tools` array — flattened, no `function` wrapper. */
export function openaiResponsesTools(app: AnyApp): unknown[] {
  return functionSpecs(app).map((fn) => ({ type: 'function', ...fn }));
}
