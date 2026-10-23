import { customRenderAsync } from '@web/testing/custom-render';
import {
  mockLandingSectionNavigation,
  MOCK_LANDING_PAGE,
  MOCK_SECTION_FAQ_TITLE,
  MOCK_SECTION_ROOT_TITLE,
} from '@web/testing/pages/landing-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';

import { LandingBreadcrumbs } from './landing-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/landing/get-landing-page/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

const HOME_LINK_STEP = { label: MOCK_SITE_SETTINGS.brand.name, href: '/' };

const setup = customRenderAsync(LandingBreadcrumbs, {
  path: 'about-us',
});

describe(`<${LandingBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getLandingPageMock, setup });
  testNotFoundOnFetchFailure({
    pageLoaderMock: getLandingPageMock,
    setup,
    eventFragment: 'landing_breadcrumbs.fetch_failed',
  });
  testBreadcrumbsTrail({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: MOCK_LANDING_PAGE,
    linkSteps: [HOME_LINK_STEP],
    currentLabel: MOCK_LANDING_PAGE.headingBlock.heading,
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: MOCK_LANDING_PAGE,
    itemPath: '/about-us',
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: MOCK_LANDING_PAGE,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: MOCK_LANDING_PAGE,
    description: 'forwards the path to getLandingPage',
    expectedArgs: ['about-us'],
  });

  describe('inside a section', () => {
    testBreadcrumbsTrail({
      pageLoaderMock: getLandingPageMock,
      setup,
      successData: {
        ...MOCK_LANDING_PAGE,
        sectionNavigation: mockLandingSectionNavigation(),
      },
      linkSteps: [
        HOME_LINK_STEP,
        { label: MOCK_SECTION_ROOT_TITLE, href: '/modules' },
      ],
      currentLabel: MOCK_SECTION_FAQ_TITLE,
    });
  });
});
