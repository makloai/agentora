import type { Metadata } from 'next';
import { site } from '@/lib/site';

const ogImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.tagline}`,
};

/** Shared Open Graph defaults; spread into a page's `openGraph` field. */
export const openGraph = {
  type: 'website' as const,
  siteName: site.name,
  images: [ogImage],
};

/** Shared Twitter card defaults — Next does not derive these from openGraph. */
export const twitter = {
  card: 'summary_large_image' as const,
  images: [ogImage],
};

/**
 * Build per-page metadata that inherits the shared social-preview image and
 * sets a canonical URL. `path` is root-relative (e.g. `/docs/design`); Next
 * resolves it to an absolute URL via the layout's `metadataBase`.
 */
export function pageMetadata({
  title,
  description,
  path = '/',
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: { ...openGraph, title, description, url: path },
    twitter: { ...twitter, title, description },
    alternates: { canonical: path },
  };
}
