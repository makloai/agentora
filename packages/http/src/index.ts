// @agentora/http — expose an agentora app as a fetch-style HTTP handler.
// POST /<action.name> with a JSON body. Discovery at GET /.well-known/actions.json.
// When the client accepts text/event-stream, handler stream events are relayed as SSE.

import { AgentoraError } from '@agentora/core';
import type { App } from '@agentora/server';
import { STATUS } from './errors';

const DISCOVERY_PATH = '.well-known/actions.json';

export interface FetchHandlerOptions {
  /** Mount prefix to strip from the path before resolving the action name. */
  basePath?: string;
}

/** A Web `fetch` handler for an agentora app. */
export function toFetchHandler(
  app: App,
  opts: FetchHandlerOptions = {}
): (req: Request) => Promise<Response> {
  const base = (opts.basePath ?? '').replace(/^\/+|\/+$/g, '');

  return async (req: Request) => {
    const url = new URL(req.url);
    let path = url.pathname.replace(/^\/+/, '');
    if (base && path.startsWith(`${base}/`)) {
      path = path.slice(base.length + 1);
    } else if (base && path === base) {
      path = '';
    }

    if (req.method === 'GET' && path === DISCOVERY_PATH) {
      return json(app.manifest());
    }

    if (req.method !== 'POST') {
      return json({ error: 'METHOD_NOT_ALLOWED', message: 'use POST /<action>' }, 405);
    }

    const input = await readJson(req);

    if (acceptsEventStream(req)) {
      return streamResponse(app, path, input, req);
    }

    try {
      const output = await app.invoke(path, input, { req });
      return json(output);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

function acceptsEventStream(req: Request): boolean {
  return (req.headers.get('accept') ?? '').includes('text/event-stream');
}

function streamResponse(app: App, name: string, input: unknown, req: Request): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        const output = await app.invoke(name, input, {
          req,
          stream: {
            log: (message, data) => send('log', { message, data }),
            progress: (fraction) => send('progress', { fraction }),
            artifact: (artifactName, value) => send('artifact', { name: artifactName, value }),
          },
        });
        send('result', output);
      } catch (err) {
        send('error', errorBody(err));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
  });
}

async function readJson(req: Request): Promise<unknown> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function errorBody(err: unknown): { error: string; message: string; data?: unknown } {
  if (err instanceof AgentoraError) {
    return { error: err.code, message: err.message, data: err.data };
  }
  return { error: 'INTERNAL', message: err instanceof Error ? err.message : String(err) };
}

function errorResponse(err: unknown): Response {
  const status = err instanceof AgentoraError ? STATUS[err.code] : 500;
  return json(errorBody(err), status);
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
