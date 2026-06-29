import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { docPager } from '@/lib/docs';

/** Prev/next links derived from the ordered docs list. */
export function DocPager({ href }: { href: string }) {
  const { prev, next } = docPager(href);

  return (
    <div className="mt-14 grid gap-3 border-border/70 border-t pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          className="group flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-card"
          href={prev.href}
        >
          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
            <ArrowLeft className="size-3.5" /> Previous
          </span>
          <span className="font-medium text-foreground group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          className="group flex flex-col items-end gap-1 rounded-xl border border-border p-4 text-right transition-colors hover:border-primary/40 hover:bg-card"
          href={next.href}
        >
          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
            Next <ArrowRight className="size-3.5" />
          </span>
          <span className="font-medium text-foreground group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
