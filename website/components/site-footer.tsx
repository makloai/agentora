import Link from 'next/link';
import { site } from '@/lib/site';

const columns = [
  {
    title: 'Docs',
    links: [
      { href: '/docs', label: 'Overview' },
      { href: '/docs/getting-started', label: 'Getting started' },
      { href: '/docs/design', label: 'Design' },
      { href: '/docs/packages', label: 'Packages' },
      { href: '/docs/doctor', label: 'Doctor' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: site.github, label: 'GitHub', external: true },
      { href: site.npm, label: 'npm', external: true },
      { href: '/#surfaces', label: 'Surfaces' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-border/70 border-t bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link
            className="flex items-center gap-2 font-mono font-semibold text-sm"
            href="/"
          >
            <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
              ◆
            </span>
            {site.name}
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {site.tagline}
          </p>
        </div>
        {columns.map((column) => (
          <div className="space-y-3" key={column.title}>
            <div className="font-semibold text-foreground text-sm">
              {column.title}
            </div>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  {'external' in link && link.external ? (
                    <a
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={link.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-border/70 border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-muted-foreground text-sm sm:flex-row">
          <span className="font-mono">
            ◆ {site.name} · {site.license}
          </span>
          <span>© 2026 {site.name}. Open source under {site.license}.</span>
        </div>
      </div>
    </footer>
  );
}
