// @agentora/http — expose an agentora app as a fetch-style HTTP handler.
import { type App } from '@agentora/server';

/** A Web `fetch` handler: POST /<action.name> with a JSON body. */
export function toFetchHandler(_app: App): (req: Request) => Promise<Response> {
  return async (_req: Request) => {
    // TODO: route by action name, build ctx via app.context, run middleware + handler,
    // map AgentoraError codes to HTTP status, stream when the handler streams.
    return new Response(JSON.stringify({ error: 'NOT_IMPLEMENTED' }), {
      status: 501,
      headers: { 'content-type': 'application/json' },
    });
  };
}
