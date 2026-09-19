import { routes } from '@blog/config';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const buildBookmarksMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations('bookmarksPage');

  return {
    title: t('title'),
    description: t('metaDescription'),
    alternates: { canonical: routes.bookmarks() },
    robots: { index: false, follow: false },
  };
};
