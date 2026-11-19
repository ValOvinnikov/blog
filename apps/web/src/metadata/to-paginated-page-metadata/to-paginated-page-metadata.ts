import type { TSeoResolved } from '@shinefold/service';
import {
  toLocalizedPageMetadata,
  type TToLocalizedPageMetadataOptions,
} from '@web/metadata/to-localized-page-metadata';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TToPaginatedPageMetadataOptions = TToLocalizedPageMetadataOptions & {
  page: number;
};

/** Page 2+ carries no hreflang: each language's list need not run to the same number of pages. */
export const toPaginatedPageMetadata = async (
  seo: TSeoResolved,
  { page, translations, ...options }: TToPaginatedPageMetadataOptions,
): Promise<Metadata> => {
  if (page === 1) {
    return toLocalizedPageMetadata(seo, { ...options, translations });
  }

  const t = await getTranslations('pagination');
  const pageSuffix = t('pageSuffix', { page });

  return toLocalizedPageMetadata(
    {
      ...seo,
      title: `${seo.title} ${pageSuffix}`,
      ogTitle: seo.ogTitle ? `${seo.ogTitle} ${pageSuffix}` : undefined,
    },
    { ...options, translations: [] },
  );
};
