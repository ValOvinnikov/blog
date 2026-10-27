import { BRAND_VARIANT } from '@blog/config';
import type { TSectionPageCard, TSectionPagesModule } from '@blog/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const MOCK_SECTION_PAGE_TITLE = 'FAQ';
export const MOCK_SECTION_PAGE_SUMMARY = 'Answers to the questions we hear most.';
export const MOCK_SECTION_PAGE_PATH = 'modules/faq';
export const MOCK_SECTION_PAGES_HEADING = 'In this section';

export const mockSectionPageCard = (
  overrides: Partial<TSectionPageCard> = {},
): TSectionPageCard => ({
  id: 'faq',
  title: MOCK_SECTION_PAGE_TITLE,
  summary: MOCK_SECTION_PAGE_SUMMARY,
  image: undefined,
  path: MOCK_SECTION_PAGE_PATH,
  ...overrides,
});

export const mockSectionPagesModule = (
  overrides: Partial<TSectionPagesModule> = {},
): TSectionPagesModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_SECTION_PAGES_HEADING }),
  pages: [mockSectionPageCard()],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
