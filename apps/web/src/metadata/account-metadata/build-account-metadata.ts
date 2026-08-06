import { routes } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for the auth-gated `/account` hub. Same stance as
 * `build-bookmarks-metadata` — no OG/Twitter card shape (private, per-reader
 * content) and `robots: noindex` regardless of environment, since account
 * settings should never surface in search results.
 */
export async function buildAccountMetadata(): Promise<Metadata> {
  const t = await getTranslations('accountPage');

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: { canonical: routes.account() },
    robots: { index: false, follow: false },
  };
}
