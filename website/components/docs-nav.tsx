'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docsPages } from '@/lib/docs';

/** Sidebar nav with the current page highlighted via the active pathname. */
export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <p className="px-3 pb-2 font-medium text-muted-foreground/70 text-xs uppercase tracking-[0.16em]">
        Documentation
      </p>
      {docsPages.map((page) => {
        const active = pathname === page.href;
        return (
          <Link
            className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-card hover:text-foreground'
            }`}
            href={page.href}
            key={page.href}
          >
            {page.title}
          </Link>
        );
      })}
    </nav>
  );
}
