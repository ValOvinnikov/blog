import { routes } from '@blog/config';
import type { TSectionDocumentType } from '@blog/service';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getSectionDocumentPage } from '@web/server/section-document/get-section-document-page/get-section-document-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

const SECTION_DOCUMENT_HREF = {
  page_privacyDocument: routes.privacyDocument,
  page_legalDocument: routes.legalDocument,
} satisfies Record<TSectionDocumentType, (slug: string) => string>;

export const buildSectionDocumentMetadata = async (
  type: TSectionDocumentType,
  slug: string,
): Promise<Metadata> => {
  const result = await getSectionDocumentPage(type, slug);

  if (!result.ok) {
    logger.error(SECTION_DOCUMENT_LOG.METADATA_FETCH_FAILED, {
      type,
      slug,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const toHref = SECTION_DOCUMENT_HREF[type];

  return toLocalizedPageMetadata(seo, {
    href: toHref(slug),
    translations: translations.map(({ language, slug: translatedSlug }) => ({
      language,
      href: toHref(translatedSlug),
    })),
    ogType: 'website',
  });
};
