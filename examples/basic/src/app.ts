// app.ts — the single entry point. Surface-agnostic.
import { createApp, router } from '@agentora/server';
import { auth, concurrency, idempotency, redact, trace } from '@agentora/server/middleware';
import { impls } from './server/products';

export interface Ctx {
  user?: { scopes?: string[] } | null;
}

export const app = createApp<Ctx>({
  router: router(impls),
  context: async (req): Promise<Ctx> => {
    // A real app would verify a token here; the demo trusts a header.
    const scopes = req.headers.get('x-scopes')?.split(',') ?? [];
    return { user: scopes.length ? { scopes } : null };
  },
  use: [trace(), auth(), idempotency(), concurrency(16), redact()],
});
