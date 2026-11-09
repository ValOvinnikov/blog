import { CONTENT_ALIGNMENT, LOCALE_ISO_CODES } from '@blog/config';
import type { TSectionIndexPage } from '@blog/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const mockSectionIndexPage = (
  overrides: Partial<TSectionIndexPage> = {},
): TSectionIndexPage => {
  return {
    id: 'privacy-index-en',
    headingBlock: mockHeadingBlock({ heading: 'Privacy' }),
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    hero: undefined,
    modules: [],
    faqs: [],
    seo: mockSeo(),
    translations: [LOCALE_ISO_CODES.EN],
    ...overrides,
  };
};
