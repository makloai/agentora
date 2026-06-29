/** Ordered docs pages — drives the sidebar nav, prev/next pager, and sitemap. */
export const docsPages = [
  {
    slug: '',
    href: '/docs',
    title: 'Overview',
    description:
      'agentora is a capability layer that turns one typed contract into every agent surface.',
  },
  {
    slug: 'getting-started',
    href: '/docs/getting-started',
    title: 'Getting started',
    description:
      'Install agentora, define a contract, implement it server-side, and expose every surface.',
  },
  {
    slug: 'design',
    href: '/docs/design',
    title: 'Design',
    description:
      'The contract-first split, the manifest IR, middleware, and how surfaces are adapters.',
  },
  {
    slug: 'packages',
    href: '/docs/packages',
    title: 'Packages',
    description:
      'Per-package reference for core, server, every surface adapter, and the error taxonomy.',
  },
  {
    slug: 'doctor',
    href: '/docs/doctor',
    title: 'Agent-readiness doctor',
    description:
      'The readiness linter — its rules, deterministic scoring, and CI integration.',
  },
] as const;

export function docPager(href: string) {
  const index = docsPages.findIndex((p) => p.href === href);
  return {
    prev: index > 0 ? docsPages[index - 1] : null,
    next: index < docsPages.length - 1 ? docsPages[index + 1] : null,
  };
}
