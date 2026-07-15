import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { Metadata } from 'next';

/**
 * Metadata for a blog list page. Every page self-canonicalizes — page 2+
 * must NEVER canonical to /blog (spec do-not-change rule). No rel=next/prev.
 */
export async function buildBlogListMetadata(page: number): Promise<Metadata> {
  const settingsResult = await service.global.siteSettings.v1.getSiteSettings();
  const description = settingsResult.ok ? settingsResult.data.description : '';

  return {
    title: page === 1 ? 'Blog' : `Blog – Page ${page}`,
    description,
    alternates: { canonical: routes.blogIndex(page) },
  };
}
