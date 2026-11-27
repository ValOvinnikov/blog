import { faker } from '@faker-js/faker';
import { REDIRECT_STATUS } from '@shinefold/config';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config/constants';
import { service, type TLandingPage } from '@shinefold/service';
import { errorResult, okResult } from '@shinefold/utils';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { LANDING_PAGE_LOG } from '@web/constants/landing-page';
import { customRenderServerAsync } from '@web/testing/custom-render';
import {
  mockLandingAdjacentPages,
  mockLandingSectionNavigation,
  MOCK_LANDING_PAGE,
} from '@web/testing/pages/landing-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_FAQ_PAGE_JSON_LD_FRAGMENT,
  mockFaqPageQuestion,
} from '@web/testing/shared/json-ld/fixtures';
import { readJsonLd } from '@web/testing/shared/json-ld/read-json-ld';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { permanentRedirect } from 'next/navigation';

import { LandingModuleRenderer } from './landing-module-renderer';
import { LandingPage } from './landing-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: { landing: { v1: { getPage: vi.fn(), getRedirect: vi.fn() } } },
  },
}));

vi.mock('@web/components/features/landing/landing-breadcrumbs');
vi.mock('./landing-module-renderer');

const getPageMock = vi.mocked(service.pages.landing.v1.getPage);
const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const MOCK_LANDING_PATH = MOCK_LANDING_PAGE.path;
const MOCK_HERO = { id: faker.string.uuid(), type: 'module_heroBlog' } as const;
const MOCK_MOVED_DESTINATION = `/${faker.lorem.slug()}`;

const resolvePageWith = (overrides: Partial<TLandingPage>) =>
  getPageMock.mockResolvedValueOnce(
    okResult({ ...MOCK_LANDING_PAGE, ...overrides }),
  );

const setup = customRenderServerAsync(LandingPage, {
  path: MOCK_LANDING_PATH,
});

describe(`<${LandingPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockResolvedValue(okResult(MOCK_LANDING_PAGE));
    getRedirectMock.mockResolvedValue(okResult());
  });

  describe('with an existing page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('skips the redirect lookup when the page exists', () => {
      expect(getRedirectMock).not.toHaveBeenCalled();
    });

    it('fetches the page for the given path with the tenant context', () => {
      expect(getPageMock).toHaveBeenCalledWith(
        [MOCK_LANDING_PATH],
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('places the breadcrumb trail above the page heading when there is no hero', () => {
      expect(LandingBreadcrumbs).toHaveBeenCalledWith({
        path: MOCK_LANDING_PATH,
        isAbovePageHeading: true,
      });
    });
  });

  it('redirects permanently when the missing path has moved', async () => {
    getPageMock.mockResolvedValueOnce(okResult());
    getRedirectMock.mockResolvedValueOnce(
      okResult({
        destination: MOCK_MOVED_DESTINATION,
        status: REDIRECT_STATUS.PERMANENT,
      }),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(permanentRedirect).toHaveBeenCalledWith(MOCK_MOVED_DESTINATION);
  });

  it('logs and throws to the error boundary when the fetch fails', async () => {
    getPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toBe(MOCK_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      LANDING_PAGE_LOG.PAGE_FETCH_FAILED,
      {
        path: MOCK_LANDING_PATH,
        error: MOCK_ERROR,
      },
    );
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolvePageWith({ faqs: [mockFaqPageQuestion()] });

    await setup();

    expect(readJsonLd()).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });

  it('hands the hero, heading, modules and navigation to the module renderer', async () => {
    const page = {
      ...MOCK_LANDING_PAGE,
      hero: MOCK_HERO,
      sectionNavigation: mockLandingSectionNavigation(),
      adjacentPages: mockLandingAdjacentPages(),
    };
    getPageMock.mockResolvedValueOnce(okResult(page));

    await setup();

    expect(LandingModuleRenderer).toHaveBeenCalledWith({
      hero: MOCK_HERO,
      headingBlock: MOCK_LANDING_PAGE.headingBlock,
      headingAlignment: MOCK_LANDING_PAGE.headingAlignment,
      modules: MOCK_LANDING_PAGE.modules,
      landingPage: { id: MOCK_LANDING_PAGE.id, path: MOCK_LANDING_PATH },
      navigation: page,
    });
  });
});
