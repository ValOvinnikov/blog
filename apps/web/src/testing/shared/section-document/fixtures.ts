import {
  CONTENT_ALIGNMENT,
  LEGAL_PAGE_KIND,
  LOCALE_ISO_CODES,
} from '@blog/config';
import type { TSectionDocumentDetail } from '@blog/service';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

const MOCK_SECTION_DOCUMENT_SLUG = 'privacy-policy';

export const mockSectionDocumentDetail = (
  overrides: Partial<TSectionDocumentDetail> = {},
): TSectionDocumentDetail => {
  return {
    id: 'section-document-1',
    type: 'page_privacyDocument',
    title: 'Privacy policy',
    slug: MOCK_SECTION_DOCUMENT_SLUG,
    kind: LEGAL_PAGE_KIND.PRIVACY_POLICY,
    headingBlock: undefined,
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    body: MOCK_CONTENTS_RAIL_BODY,
    seo: mockSeo(),
    translations: [
      { language: LOCALE_ISO_CODES.EN, slug: MOCK_SECTION_DOCUMENT_SLUG },
    ],
    ...overrides,
  };
};
