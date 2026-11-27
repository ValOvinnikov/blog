import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { LANDING_PAGE_LOG } from '@web/constants/landing-page';
import { customRenderServerAsync } from '@web/testing/custom-render';
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
  testThrowsOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';
import { MOCK_TENANT_NAME } from '@web/testing/shared/tenant/fixtures';

import { LandingBreadcrumbs } from './landing-breadcrumbs';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds');

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/server/landing/get-landing-page/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

faker.seed(5776);

const MOCK_LANDING_PATH = faker.lorem.slug();
const HOME_LINK_STEP = { label: MOCK_TENANT_NAME, href: '/' };

const setup = customRenderServerAsync(LandingBreadcrumbs, {
  path: MOCK_LANDING_PATH,
});

describe(`<${LandingBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
  });

  testNotFoundWithoutLog({ pageLoaderMock: getLandingPageMock, setup });
  testThrowsOnFetchFailure({
    pageLoaderMock: getLandingPageMock,
    setup,
    eventFragment: LANDING_PAGE_LOG.BREADCRUMBS_FETCH_FAILED,
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
