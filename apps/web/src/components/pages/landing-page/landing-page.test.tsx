import { LOCALE_ISO_CODES } from '@blog/config';
import { service } from '@blog/service';
import { permanentRedirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { makeCtaModuleData } from '@web/testing/modules/cta/fixtures';
import { makeHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import {
  makeLandingSectionNavigation,
  mockLandingPage,
} from '@web/testing/pages/landing-page/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { LandingPage } from './landing-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: { landing: { v1: { getPage: vi.fn(), getRedirect: vi.fn() } } },
    modules: {
      cta: { v1: { getCta: vi.fn() } },
      heroBlog: { v1: { getHeroBlog: vi.fn() } },
    },
  },
}));

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getPageMock = vi.mocked(service.pages.landing.v1.getPage);
const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const FAQ_PAGE_JSON_LD = '"@type":"FAQPage"';

const setup = customRenderServerAsync(LandingPage, {
  path: 'about-us',
});

describe(`<${LandingPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockResolvedValue({ ok: true, data: mockLandingPage });
    getRedirectMock.mockResolvedValue({ ok: true, data: undefined });
  });

  it('redirects permanently when the missing path has moved', async () => {
    getPageMock.mockResolvedValueOnce({ ok: true, data: undefined });
    getRedirectMock.mockResolvedValueOnce({ ok: true, data: '/company/about' });

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: '/company/about',
      locale: DEFAULT_REQUEST_CONTEXT.locale,
    });
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the page without a redirect lookup when the page exists', async () => {
    await setup();

    expect(getRedirectMock).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getPageMock.mockResolvedValueOnce({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'landing_page.fetch_failed',
      expect.objectContaining({ path: 'about-us' }),
    );
  });

  it('calls notFound() without logging when the page does not exist', async () => {
    getPageMock.mockResolvedValueOnce({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('calls notFound() when the slug exists only in another language', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      sanityContext: {
        ...DEFAULT_TENANT_SANITY_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      },
    });
    getPageMock.mockImplementation(async (_segments, tenant) => ({
      ok: true,
      data: tenant.locale === LOCALE_ISO_CODES.EN ? mockLandingPage : undefined,
    }));

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalled();
  });

  it('fetches the page for the given path with the tenant context', async () => {
    await setup();

    expect(getPageMock).toHaveBeenCalledWith(
      ['about-us'],
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the page heading and supporting text inside main', async () => {
    getPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockLandingPage,
        headingBlock: makeHeadingBlock({
          heading: 'About Us',
          supportingText: 'Who we are.',
        }),
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { level: 1, name: 'About Us' }),
    ).toBeVisible();
    expect(within(main).getByText('Who we are.')).toBeVisible();
  });

  it('renders the breadcrumb trail outside main', async () => {
    await setup();

    const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(breadcrumbs).getByRole('link', { name: 'Home' }),
    ).toBeVisible();
    expect(within(breadcrumbs).getByText('About Us')).toBeVisible();
    expect(screen.getByRole('main')).not.toContainElement(breadcrumbs);
  });

  it('renders no section navigation when the page is outside a section', async () => {
    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'In this section' }),
    ).not.toBeInTheDocument();
  });

  it('renders the section navigation inside main with the current page marked', async () => {
    getPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockLandingPage,
        sectionNavigation: makeLandingSectionNavigation(),
      },
    });

    await setup();

    const sectionNav = within(screen.getByRole('main')).getByRole(
      'navigation',
      { name: 'In this section' },
    );
    expect(
      within(sectionNav).getByRole('link', { name: 'FAQ' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('renders the authored modules inside main', async () => {
    getPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockLandingPage,
        modules: [{ id: 'cta-1', type: 'module_cta' }],
      },
    });
    vi.mocked(service.modules.cta.v1.getCta).mockResolvedValueOnce({
      ok: true,
      data: makeCtaModuleData({
        headingBlock: makeHeadingBlock({ heading: 'Join the list' }),
      }),
    });

    await setup();

    expect(
      within(screen.getByRole('main')).getByRole('region', {
        name: 'Join the list',
      }),
    ).toBeVisible();
  });

  it('renders the hero in place of the page heading when one is set', async () => {
    getPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockLandingPage,
        hero: { id: 'hero-1', type: 'module_heroBlog' },
      },
    });
    vi.mocked(service.modules.heroBlog.v1.getHeroBlog).mockResolvedValueOnce({
      ok: true,
      data: makeHeroBlogData({ heading: 'Meet the team' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Meet the team' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'About Us' }),
    ).not.toBeInTheDocument();
  });

  it('renders no FAQPage JSON-LD when the page has no FAQ questions', async () => {
    await setup();

    const scripts = screen.getAllByTestId('json-ld-script');
    expect(
      scripts.some((script) => script.textContent?.includes(FAQ_PAGE_JSON_LD)),
    ).toBe(false);
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    getPageMock.mockResolvedValueOnce({
      ok: true,
      data: {
        ...mockLandingPage,
        faqs: [
          {
            id: 'faq-1',
            question: 'Do you offer a free trial?',
            answer: 'Yes.',
          },
        ],
      },
    });

    await setup();

    const scripts = screen.getAllByTestId('json-ld-script');
    expect(
      scripts.some((script) => script.textContent?.includes(FAQ_PAGE_JSON_LD)),
    ).toBe(true);
  });
});
