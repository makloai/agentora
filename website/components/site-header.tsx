import Link from 'next/link';
import { ThemeToggle } from '@/components/theme';
import { nav, site } from '@/lib/site';

/** Sticky marketing header — logo, section nav, theme toggle, and repo CTA. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-border/70 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          aria-label={site.name}
          className="flex items-center gap-2 font-mono font-semibold text-sm tracking-tight"
          href="/"
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
            ◆
          </span>
          {site.name}
        </Link>

        <div className="flex items-center gap-1 text-muted-foreground text-sm sm:gap-2">
          {nav.map((link) => (
            <Link
              className="hidden rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground sm:block"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="hidden rounded-lg px-2.5 py-1.5 transition-colors hover:text-foreground sm:block"
            href={site.npm}
            rel="noreferrer"
            target="_blank"
          >
            npm
          </a>
          <ThemeToggle />
          <a
            className="rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-foreground hover:text-background"
            href={site.github}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
