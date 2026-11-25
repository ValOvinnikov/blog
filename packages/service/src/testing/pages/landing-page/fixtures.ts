import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import type { TRawLandingPage } from '@shinefold/service/features/pages/landing/adaptor/detail-page/transformer';
import {
  MOCK_ABOUT_PAGE_TITLE,
  mockRawContentRef,
  mockRawCtaRef,
} from '@shinefold/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_ABOUT_SLUG } from '@shinefold/service/testing/shared/translated-pages-dataset';

export function mockRawLandingPage(
  overrides: Partial<TRawLandingPage> = {},
): TRawLandingPage {
  return {
    _id: MOCK_ABOUT_SLUG,
    path: MOCK_ABOUT_SLUG,
    headingBlock: mockRawHeadingBlock(MOCK_ABOUT_PAGE_TITLE),
    contentAlignment: null,
    hero: null,
    modules: [mockRawContentRef(), mockRawCtaRef()],
    seo: mockRawSeo(),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: MOCK_ABOUT_SLUG }],
    showSectionNavigation: null,
    sectionChain: [
      {
        _id: MOCK_ABOUT_SLUG,
        title: MOCK_ABOUT_PAGE_TITLE,
        path: MOCK_ABOUT_SLUG,
        sectionNavigation: false,
        sectionNavigationTitle: null,
        showPreviousNextLinks: true,
        children: null,
      },
    ],
    ...overrides,
  };
}
