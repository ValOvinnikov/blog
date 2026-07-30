import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for the static `/topics` hub. Unlike `buildCategoryMetadata` /
 * `buildAuthorMetadata`, this needs no per-slug fetch — the page lists every
 * category, so its title/description are fixed copy rather than derived from
 * a single document. Shares the `topicsPage` message namespace with
 * `TopicsPage` itself — the `<h1>`/intro copy and the metadata title/
 * description are the same strings.
 */
export async function buildTopicsMetadata(): Promise<Metadata> {
  const t = await getTranslations('topicsPage');
  const title = t('title');
  const description = t('intro');

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: undefined,
    },
    { canonical: routes.topics(), ogType: 'website' },
  );
}
