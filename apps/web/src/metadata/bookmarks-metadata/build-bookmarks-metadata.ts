import { routes } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for the auth-gated `/bookmarks` page. Deliberately skips
 * `toMetadata`'s OG/Twitter card shape — this route has no publicly
 * shareable content (it's per-reader, private) — and always sets
 * `robots: noindex` regardless of environment, since it's account content
 * that should never surface in search results even in production.
 */
export const buildBookmarksMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('bookmarksPage');

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: { canonical: routes.bookmarks() },
    robots: { index: false, follow: false },
  };
};
