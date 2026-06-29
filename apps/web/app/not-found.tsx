import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <p className="font-medium font-mono text-muted-foreground text-sm tracking-widest">
        404
      </p>
      <div className="flex flex-col gap-2">
        <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
          This page could not be found
        </h1>
        <p className="max-w-md text-pretty text-muted-foreground">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been
          moved. Try the docs, or head back home.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          className="rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90"
          href="/"
        >
          Back to home
        </Link>
        <Link
          className="rounded-xl border border-border px-5 py-2.5 font-medium text-foreground text-sm transition-colors hover:bg-card"
          href="/docs"
        >
          Read the docs
        </Link>
      </div>
    </main>
  );
}
