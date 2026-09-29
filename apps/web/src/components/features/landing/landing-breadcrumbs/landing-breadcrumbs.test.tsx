import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { customRenderAsync } from '@web/testing/custom-render';
import { mockLandingPage } from '@web/testing/pages/landing-page/fixtures';
import {
  testBreadcrumbsJsonLdSchema,
  testBreadcrumbsTrail,
  testForwardsArgsToLoader,
  testNoJsonLdWithoutBaseUrl,
  testNotFoundOnFetchFailure,
  testNotFoundWithoutLog,
} from '@web/testing/shared/breadcrumbs-page-contract/breadcrumbs-page-contract';

import { LandingBreadcrumbs } from './landing-breadcrumbs';

const { getLandingPageMock } = vi.hoisted(() => ({
  getLandingPageMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/server/landing/get-landing-page', () => ({
  getLandingPage: getLandingPageMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url');

const getTenantBaseUrlMock = vi.mocked(getTenantBaseUrl);

const setup = customRenderAsync(LandingBreadcrumbs, {
  slug: 'about-us',
  tenant: 'tenant-1',
});

describe(`<${LandingBreadcrumbs.name}/>`, () => {
  beforeEach(() => {
    getLandingPageMock.mockReset();
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
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
    linkSteps: [{ label: 'Home', href: '/' }],
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
    getTenantBaseUrlMock,
  });
  testForwardsArgsToLoader({
    pageLoaderMock: getLandingPageMock,
    setup,
    successData: mockLandingPage,
    description: 'forwards the slug and tenant to getLandingPage',
    expectedArgs: ['about-us', 'tenant-1'],
  });
});
