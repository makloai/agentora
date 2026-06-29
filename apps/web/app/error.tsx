'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for local debugging / error-tracking breadcrumbs.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <p className="font-medium font-mono text-muted-foreground text-sm tracking-widest">
        500
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
          Something went wrong
        </h1>
        <p className="max-w-md text-pretty text-muted-foreground">
          An unexpected error occurred while loading this page. Try again, and if
          it keeps happening the reference below helps trace it.
        </p>
      </div>
      {error.digest ? (
        <code className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-muted-foreground text-xs">
          Ref: {error.digest}
        </code>
      ) : null}
      <div className="flex gap-3">
        <button
          className="rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
        <a
          className="rounded-xl border border-border px-5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-card"
          href="/"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
