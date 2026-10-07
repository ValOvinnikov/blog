import { customRenderAsync } from '@web/testing/custom-render';
import {
  makeLandingSectionNavigation,
  mockLandingPage,
} from '@web/testing/pages/landing-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

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
    successData: mockLandingPage,
    linkSteps: [{ label: 'Northwind Journal', href: '/' }],
    currentLabel: 'About Us',
  });
  testBreadcrumbsJsonLdSchema({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: mockLandingPage,
    itemPath: '/about-us',
  });
  testNoJsonLdWithoutBaseUrl({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: mockLandingPage,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: mockLandingPage,
    description: 'forwards the path to getLandingPage',
    expectedArgs: ['about-us'],
  });

  describe('inside a section', () => {
    testBreadcrumbsTrail({
      pageLoaderMock: getLandingPageMock,
      setup,
      successData: {
        ...mockLandingPage,
        sectionNavigation: makeLandingSectionNavigation(),
      },
      linkSteps: [
        { label: 'Northwind Journal', href: '/' },
        { label: 'Modules', href: '/modules' },
      ],
      currentLabel: 'FAQ',
    });
  });
});
