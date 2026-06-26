// @agentora/openai — emit OpenAI tool specs (Chat Completions + Responses).
import { type App } from '@agentora/server';

/** Chat Completions `tools` array. */
export function openaiChatTools(_app: App): unknown[] {
  // TODO: { type: 'function', function: { name, description, parameters } } per contract.
  return [];
}

/** Responses API `tools` array. */
export function openaiResponsesTools(_app: App): unknown[] {
  // TODO: Responses-shaped tool specs from the manifest IR.
  return [];
}
