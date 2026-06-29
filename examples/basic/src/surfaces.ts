// surfaces.ts — each adapter is its own import; the app stays surface-agnostic.
import { aiSdkTools } from '@agentora/ai-sdk';
import { toFetchHandler } from '@agentora/http';
import { toMcp } from '@agentora/mcp';
import { openaiChatTools, openaiResponsesTools } from '@agentora/openai';
import { app } from './app';

export const mcp = toMcp(app);
export const tools = aiSdkTools(app);
export const openaiTools = openaiChatTools(app);
export const openaiResponses = openaiResponsesTools(app);
export const fetchHandler = toFetchHandler(app);
export default fetchHandler;
