// @agentora/server/runtime — the execution pipeline (KTD6):
// resolve -> context -> validate input -> middleware onion -> handler ->
// validate output -> normalize errors to AgentoraError.

import { AgentoraError, type Schema } from '@agentora/core';
import type { App, HandlerArgs, Implemented, Middleware, Stream } from './index';

export interface InvokeOptions {
  /** The request used to build per-request context. Synthesized if absent. */
  req?: Request;
  /** Cancellation signal forwarded to the handler. */
  signal?: AbortSignal;
  /** Sink for handler stream events (log/progress/artifact). */
  stream?: Partial<Stream>;
}

function makeStream(sink?: Partial<Stream>): Stream {
  return {
    log: sink?.log ?? (() => {}),
    progress: sink?.progress ?? (() => {}),
    artifact: sink?.artifact ?? (() => {}),
  };
}

async function validate<T>(schema: Schema<T>, value: unknown) {
  return schema['~standard'].validate(value);
}

/** Compose middleware as an onion: middleware[0] is outermost, handler innermost. */
function compose(
  middleware: Middleware[],
  args: HandlerArgs<unknown, unknown>,
  handler: () => Promise<unknown>
): () => Promise<unknown> {
  return middleware.reduceRight<() => Promise<unknown>>(
    (next, mw) => () => mw(args, next),
    handler
  );
}

/** Resolve and execute an action by dotted name through the full pipeline. */
export async function invoke(
  app: App,
  name: string,
  rawInput: unknown,
  opts: InvokeOptions = {}
): Promise<unknown> {
  const impl: Implemented | undefined = app.resolve(name);
  if (!impl) {
    throw new AgentoraError('NOT_FOUND', `unknown action: ${name}`);
  }

  const req = opts.req ?? new Request(`http://agentora.local/${name}`, { method: 'POST' });
  const ctx = app.context ? await app.context(req) : undefined;

  const parsed = await validate(impl.contract.input, rawInput);
  if (parsed.issues) {
    throw new AgentoraError('VALIDATION', 'input validation failed', parsed.issues);
  }

  const signal = opts.signal ?? new AbortController().signal;
  const stream = makeStream(opts.stream);
  const args: HandlerArgs<unknown, unknown> = {
    input: parsed.value,
    ctx,
    stream,
    signal,
    contract: impl.contract,
  };

  let output: unknown;
  try {
    output = await compose(app.middleware, args, () => impl.handler(args))();
  } catch (err) {
    if (err instanceof AgentoraError) {
      throw err;
    }
    if (signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw new AgentoraError('CANCELLED', 'action cancelled', err);
    }
    throw new AgentoraError('INTERNAL', err instanceof Error ? err.message : String(err), err);
  }

  const validated = await validate(impl.contract.output, output);
  if (validated.issues) {
    throw new AgentoraError('INTERNAL', 'output validation failed', validated.issues);
  }
  return validated.value;
}
