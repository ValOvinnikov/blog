import { BRAND_VARIANT } from '@shinefold/config';
import type { TRawSectionPagesModule } from '@shinefold/service/features/modules/section-pages/adaptor/module/transformer';
import type { TRawSectionPages } from '@shinefold/service/features/modules/section-pages/adaptor/pages/transformer';
import {
  mockRawHeadingBlock,
  mockRawSanityImage,
} from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export const MOCK_SECTION_PAGES_MODULE_ID = 'section-pages-1';
export const MOCK_SECTION_PAGES_PARENT_ID = 'page-modules';
export const MOCK_SECTION_PAGES_PARENT_PATH = 'section-home';
export const MOCK_SECTION_PAGES_HEADING = 'In this section';

export function mockRawSectionPagesModule(
  overrides: Partial<TRawSectionPagesModule> = {},
): TRawSectionPagesModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawModuleHeadingBlock(MOCK_SECTION_PAGES_HEADING),
    contentAlignment: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}

export function mockRawSectionPage(
  overrides: Partial<TRawSectionPages[number]> = {},
): TRawSectionPages[number] {
  return {
    _id: 'page-faq',
    slug: 'faq',
    headingBlock: mockRawHeadingBlock('FAQ', {
      supportingText: 'Answers to common questions.',
    }),
    image: mockRawSanityImage(),
    ...overrides,
  };
}
