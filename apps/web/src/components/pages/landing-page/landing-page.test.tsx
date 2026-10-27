import { REDIRECT_STATUS, SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TLandingPage } from '@blog/service';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { permanentRedirect } from '@web/i18n/navigation';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import {
  mockLandingSectionNavigation,
  MOCK_LANDING_PAGE,
  MOCK_SECTION_FAQ_TITLE,
} from '@web/testing/pages/landing-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_FAQ_PAGE_JSON_LD_FRAGMENT,
  mockFaqPageQuestion,
} from '@web/testing/shared/json-ld/fixtures';
import { readJsonLd } from '@web/testing/shared/json-ld/read-json-ld';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

faker.seed(6008);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@blog/service', () => ({
  service: {
    pages: { landing: { v1: { getPage: vi.fn(), getRedirect: vi.fn() } } },
    modules: { heroBlog: { v1: { getHeroBlog: vi.fn() } } },
  },
}));

vi.mock('@web/i18n/navigation');

const getPageMock = vi.mocked(service.pages.landing.v1.getPage);
const getHeroBlogMock = vi.mocked(service.modules.heroBlog.v1.getHeroBlog);
const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const MOCK_LANDING_PATH = MOCK_LANDING_PAGE.path;
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_HERO_HEADING = faker.lorem.words(3);
const MOCK_PAGE_HEADING = MOCK_LANDING_PAGE.headingBlock.heading;
const MOCK_MOVED_DESTINATION = `/${faker.lorem.slug()}`;
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const SECTION_NAV_NAME = SITE_MESSAGES.sectionNavigation.label;

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

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: SITE_MESSAGES.breadcrumbs.ariaLabel,
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: MOCK_SITE_SETTINGS.brand.name,
      });
      const currentCrumb = within(breadcrumbs).getByText(MOCK_PAGE_HEADING);
      const main = screen.getByRole('main');

      expect(homeLink).toBeVisible();
      expect(currentCrumb).toBeVisible();
      expect(main).not.toContainElement(breadcrumbs);
    });

    it('renders no section navigation when the page is outside a section', () => {
      const sectionNav = screen.queryByRole('navigation', {
        name: SECTION_NAV_NAME,
      });

      expect(sectionNav).not.toBeInTheDocument();
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

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: MOCK_MOVED_DESTINATION,
      locale: MOCK_REQUEST_CONTEXT.locale,
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('landing_page.fetch_failed', {
      path: MOCK_LANDING_PATH,
      error: MOCK_ERROR,
    });
  });

  it('renders the page heading and supporting text inside main', async () => {
    resolvePageWith({
      headingBlock: mockHeadingBlock({
        heading: MOCK_PAGE_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    await setup();

    const main = screen.getByRole('main');
    const heading = within(main).getByRole('heading', {
      level: 1,
      name: MOCK_PAGE_HEADING,
    });
    const supportingText = within(main).getByText(MOCK_SUPPORTING_TEXT);

    expect(heading).toBeVisible();
    expect(supportingText).toBeVisible();
  });

  it('marks the current page in the section navigation inside main', async () => {
    resolvePageWith({
      sectionNavigation: mockLandingSectionNavigation(),
    });

    await setup();

    const main = screen.getByRole('main');
    const sectionNav = within(main).getByRole('navigation', {
      name: SECTION_NAV_NAME,
    });
    const currentPageLink = within(sectionNav).getByRole('link', {
      name: MOCK_SECTION_FAQ_TITLE,
    });

    expect(currentPageLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolvePageWith({ faqs: [mockFaqPageQuestion()] });

    await setup();

    expect(readJsonLd()).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });

  it('renders the hero in place of the heading when one is set', async () => {
    resolvePageWith({ hero: { id: MOCK_HERO_ID, type: 'module_heroBlog' } });
    getHeroBlogMock.mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: MOCK_HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: MOCK_PAGE_HEADING,
    });

    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });
});
