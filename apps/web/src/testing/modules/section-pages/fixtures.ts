import { BRAND_VARIANT } from '@shinefold/config';
import type { TSectionPageCard, TSectionPagesModule } from '@shinefold/service';
import type { TSectionPagesModuleContent } from '@web/modules/section-pages/section-pages-module-view';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const MOCK_SECTION_PAGE_TITLE = 'FAQ';
export const MOCK_SECTION_PAGE_SUMMARY =
  'Answers to the questions we hear most.';
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

export const mockSectionPagesContent = (
  overrides: Partial<TSectionPagesModuleContent> = {},
): TSectionPagesModuleContent => ({
  headingBlock: mockHeadingBlock({ heading: MOCK_SECTION_PAGES_HEADING }),
  pages: [mockSectionPageCard()],
  contentAlignment: undefined,
  columns: undefined,
  ...overrides,
});

export const mockSectionPagesModule = (
  overrides: Partial<TSectionPagesModule> = {},
): TSectionPagesModule => ({
  ...mockSectionPagesContent(),
  brandVariant: BRAND_VARIANT.PRIMARY,
  layout: undefined,
  ...overrides,
});
