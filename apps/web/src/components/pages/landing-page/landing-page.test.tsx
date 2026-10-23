import { LOCALE_ISO_CODES, REDIRECT_STATUS, SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service, type TLandingPage } from '@blog/service';
import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { permanentRedirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import {
  MOCK_CTA_HEADING,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import {
  mockLandingSectionNavigation,
  MOCK_LANDING_PAGE,
} from '@web/testing/pages/landing-page/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@blog/service', () => ({
  service: {
    pages: { landing: { v1: { getPage: vi.fn(), getRedirect: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
    },
  },
}));

vi.mock('@web/i18n/navigation');

const getPageMock = vi.mocked(service.pages.landing.v1.getPage);
const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const resolvePageWith = (overrides: Partial<TLandingPage>) =>
  getPageMock.mockResolvedValueOnce(
    okResult({ ...MOCK_LANDING_PAGE, ...overrides }),
  );

const LANDING_PATH = 'about-us';

const setup = customRenderServerAsync(LandingPage, {
  path: LANDING_PATH,
});

const SECTION_NAV_NAME = SITE_MESSAGES.sectionNavigation.label;
const MOVED_DESTINATION = '/company/about';
const SUPPORTING_TEXT = 'Who we are.';
const HERO_HEADING = 'Meet the team';

describe(`<${LandingPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockResolvedValue(okResult(MOCK_LANDING_PAGE));
    getRedirectMock.mockResolvedValue(okResult());
  });

  describe('with an existing page', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the page without a redirect lookup when the page exists', () => {
      expect(getRedirectMock).not.toHaveBeenCalled();
    });

    it('fetches the page for the given path with the tenant context', () => {
      expect(getPageMock).toHaveBeenCalledWith(
        [LANDING_PATH],
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the breadcrumb trail outside main', () => {
      const breadcrumbs = screen.getByRole('navigation', {
        name: 'Breadcrumb',
      });
      const homeLink = within(breadcrumbs).getByRole('link', {
        name: 'Northwind Journal',
      });
      const currentCrumb = within(breadcrumbs).getByText('About Us');
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

    it('renders no FAQPage JSON-LD when the page has no FAQ questions', () => {
      const scripts = screen.getAllByTestId(JSON_LD_SCRIPT_TEST_ID);
      expect(
        scripts.some((script) =>
          script.textContent?.includes(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT),
        ),
      ).toBe(false);
    });
  });

  describe('when no page matches the path', () => {
    beforeEach(() => {
      getPageMock.mockResolvedValueOnce(okResult());
    });

    it('redirects permanently when the missing path has moved', async () => {
      getRedirectMock.mockResolvedValueOnce(
        okResult({
          destination: MOVED_DESTINATION,
          status: REDIRECT_STATUS.PERMANENT,
        }),
      );

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(permanentRedirect).toHaveBeenCalledWith({
        href: MOVED_DESTINATION,
        locale: MOCK_REQUEST_CONTEXT.locale,
      });
      expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    });

    it('calls notFound() without logging when the page does not exist', async () => {
      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('landing_page.fetch_failed', {
      path: LANDING_PATH,
      error: MOCK_ERROR,
    });
  });

  it('calls notFound() when the slug exists only in another language', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      sanityContext: {
        ...MOCK_TENANT_SANITY_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      },
    });
    getPageMock.mockImplementation(async (_segments, tenant) =>
      okResult(
        tenant.locale === LOCALE_ISO_CODES.EN ? MOCK_LANDING_PAGE : undefined,
      ),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it('renders the page heading and supporting text inside main', async () => {
    resolvePageWith({
      headingBlock: mockHeadingBlock({
        heading: 'About Us',
        supportingText: SUPPORTING_TEXT,
      }),
    });

    await setup();

    const main = screen.getByRole('main');
    const heading = within(main).getByRole('heading', {
      level: 1,
      name: 'About Us',
    });
    const supportingText = within(main).getByText(SUPPORTING_TEXT);
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
    const faqLink = within(sectionNav).getByRole('link', { name: 'FAQ' });
    expect(faqLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders the authored modules inside main', async () => {
    resolvePageWith({
      modules: [{ id: 'cta-1', type: 'module_cta' }],
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce(
      okResult(
        mockCtaModuleData({
          headingBlock: mockHeadingBlock({ heading: MOCK_CTA_HEADING }),
        }),
      ),
    );

    await setup();

    const main = screen.getByRole('main');
    const ctaRegion = within(main).getByRole('region', {
      name: MOCK_CTA_HEADING,
    });
    expect(ctaRegion).toBeVisible();
  });

  it('renders the hero in place of the page heading when one is set', async () => {
    resolvePageWith({
      hero: { id: 'hero-1', type: 'module_heroBlog' },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce(
      okResult(mockHeroBlogData({ heading: HERO_HEADING })),
    );

    await setup();

    const heroHeading = screen.getByRole('heading', {
      level: 1,
      name: HERO_HEADING,
    });
    const pageHeading = screen.queryByRole('heading', {
      level: 1,
      name: 'About Us',
    });
    expect(heroHeading).toBeVisible();
    expect(pageHeading).not.toBeInTheDocument();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolvePageWith({
      faqs: [
        {
          id: 'faq-1',
          question: 'Do you offer a free trial?',
          answer: 'Yes.',
        },
      ],
    });

    await setup();

    const scripts = screen.getAllByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(
      scripts.some((script) =>
        script.textContent?.includes(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT),
      ),
    ).toBe(true);
  });
});
