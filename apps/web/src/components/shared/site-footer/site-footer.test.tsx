import { LOCALE_ISO_CODES, routes, SOCIAL_PLATFORMS } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { SiteFooter } from './site-footer';

const { getFooterMock, getTranslationsMock } = vi.hoisted(() => ({
  getFooterMock: vi.fn(),
  getTranslationsMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-language-switcher-style/get-language-switcher-style',
  () => ({
    getLanguageSwitcherStyle: vi.fn().mockResolvedValue('MENU_CODE'),
  }),
);

vi.mock(
  '@web/server/site-settings/get-site-settings/get-site-settings',
  () => ({
    getSiteSettings: vi.fn(),
  }),
);

vi.mock('@blog/service', () => ({
  service: { global: { footer: { v1: { getFooter: getFooterMock } } } },
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

const translations: Record<string, string> = {
  feedLinkLabel: 'RSS feed',
  linkAriaLabel: '{platform} profile',
};

const translate = (key: string, values?: Record<string, string>): string => {
  const template = translations[key] ?? key;
  if (!values) return template;
  return Object.entries(values).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, value),
    template,
  );
};

const getRequestContextMock = vi.mocked(getRequestContext);
const getSiteSettingsMock = vi.mocked(getSiteSettings);

const setup = customRenderAsync(SiteFooter, {});

const makeSocial = (platform: string, label: string, href: string) => ({
  platform,
  link: {
    label,
    href,
    target: '_blank',
    platform: undefined,
    ariaLabel: undefined,
  },
});

describe(SiteFooter, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'Blog', logo: undefined } },
    } as never);
    getFooterMock.mockResolvedValue({ ok: true, data: { social: [] } });
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getTranslationsMock.mockResolvedValue(translate);
  });

  it('forwards the tenant Sanity context to the footer loader', async () => {
    await setup();

    expect(getFooterMock).toHaveBeenCalledWith(
      DEFAULT_REQUEST_CONTEXT.sanityContext,
    );
  });

  it('shows the brand name and the current year in the copyright', async () => {
    await setup();

    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveTextContent('Blog');
    expect(footer).toHaveTextContent(String(new Date().getFullYear()));
  });

  it('adds a visible RSS feed link to the footer nav', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'RSS feed' });

    expect(link).toHaveAttribute('href', routes.rssFeed());
    expect(link).toHaveAttribute('title', 'RSS feed');
    expect(within(link).getByTestId('rss-icon')).toBeVisible();
  });

  it('renders a mapped social link icon-only, named after its platform', async () => {
    getFooterMock.mockResolvedValue({
      ok: true,
      data: {
        social: [
          makeSocial(
            SOCIAL_PLATFORMS.LINKEDIN,
            'LinkedIn',
            'https://www.linkedin.com/in/example',
          ),
        ],
      },
    });

    await setup();

    const link = screen.getByRole('link', { name: 'LinkedIn profile' });

    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/example');
    expect(link).toHaveAttribute('title', 'LinkedIn profile');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.LINKEDIN}`),
    ).toBeVisible();
  });

  it('renders an icon-only social link for a platform outside the original 6-key set', async () => {
    getFooterMock.mockResolvedValue({
      ok: true,
      data: {
        social: [
          makeSocial(
            SOCIAL_PLATFORMS.MASTODON,
            'Mastodon',
            'https://mastodon.social/@example',
          ),
        ],
      },
    });

    await setup();

    const link = screen.getByRole('link', { name: 'Mastodon profile' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).toBeVisible();
  });

  it('shows the language switcher in the footer when its toggle is on and several languages are live', async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getFooterMock.mockResolvedValue({
      ok: true,
      data: { social: [], showLanguageSwitcher: true },
    });

    await setup();

    expect(
      within(screen.getByRole('contentinfo')).getByRole('navigation', {
        name: 'Language',
      }),
    ).toBeVisible();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getFooterMock.mockResolvedValue({
      ok: true,
      data: { social: [], showLanguageSwitcher: true },
    });

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getFooterMock.mockResolvedValue({ ok: false, error: 'boom' });

      await setup();

      expect(screen.getByRole('link', { name: 'RSS feed' })).toBeVisible();
      expect(
        errorSpy.mock.calls.some((call) =>
          call.some(
            (arg) =>
              typeof arg === 'string' &&
              arg.includes('footer.layout_fetch_failed'),
          ),
        ),
      ).toBe(true);
      errorSpy.mockRestore();
    });
  });
});
