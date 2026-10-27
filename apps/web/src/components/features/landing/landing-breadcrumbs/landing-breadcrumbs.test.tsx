import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRenderAsync } from '@web/testing/custom-render';
import {
  mockLandingSectionNavigation,
  MOCK_LANDING_PAGE,
  MOCK_SECTION_FAQ_TITLE,
  MOCK_SECTION_ROOT_PATH,
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

faker.seed(5776);

const MOCK_LANDING_PATH = faker.lorem.slug();
const HOME_LINK_STEP = { label: MOCK_SITE_SETTINGS.brand.name, href: '/' };

const setup = customRenderAsync(LandingBreadcrumbs, {
  path: MOCK_LANDING_PATH,
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
    logContext: { path: MOCK_LANDING_PATH },
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
    itemPath: routes.landingPage(MOCK_LANDING_PATH),
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
    expectedArgs: [MOCK_LANDING_PATH],
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
        {
          label: MOCK_SECTION_ROOT_TITLE,
          href: routes.landingPage(MOCK_SECTION_ROOT_PATH),
        },
      ],
      currentLabel: MOCK_SECTION_FAQ_TITLE,
    });
  });
});
