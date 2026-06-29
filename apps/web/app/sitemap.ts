import type { MetadataRoute } from 'next';
import { docsPages } from '@/lib/docs';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ['/', '/legal/privacy', '/legal/terms'];

  return [
    ...staticPaths.map((path) => ({
      url: `${site.url}${path === '/' ? '' : path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '/' ? 1 : 0.4,
    })),
    ...docsPages.map((page) => ({
      url: `${site.url}${page.href}`,
      changeFrequency: 'weekly' as const,
      priority: page.slug === '' ? 0.8 : 0.6,
    })),
  ];
}
