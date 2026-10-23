import {
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  routes,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SiteFooter } from './site-footer';

const { getFooterMock, getTranslationsMock } = vi.hoisted(() => ({
  getFooterMock: vi.fn(),
  getTranslationsMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-language-switcher-style/get-language-switcher-style',
  () => ({
    getLanguageSwitcherStyle: vi.fn(),
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

vi.mocked(getLanguageSwitcherStyle).mockResolvedValue(
  LANGUAGE_SWITCHER_STYLE.MENU_CODE,
);

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

const LINKEDIN_URL = 'https://www.linkedin.com/in/example';
const LINKEDIN_LABEL = 'LinkedIn profile';
const MASTODON_URL = 'https://mastodon.social/@example';

describe(SiteFooter, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue(
      okResult({ brand: { name: 'Blog', logo: undefined } }) as never,
    );
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: true }),
    );
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
    getTranslationsMock.mockResolvedValue(translate);
  });

  describe('with the default footer', () => {
    beforeEach(async () => {
      await setup();
    });

    it('forwards the tenant Sanity context to the footer loader', async () => {
      expect(getFooterMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.sanityContext,
      );
    });

    it('shows the brand name and the current year in the copyright', async () => {
      const footer = screen.getByRole('contentinfo');

      expect(footer).toHaveTextContent('Blog');
      expect(footer).toHaveTextContent(String(new Date().getFullYear()));
    });

    it('adds a visible RSS feed link to the footer nav', async () => {
      const link = screen.getByRole('link', { name: 'RSS feed' });

      expect(link).toHaveAttribute('href', routes.rssFeed());
      expect(link).toHaveAttribute('title', 'RSS feed');
      expect(within(link).getByTestId('rss-icon')).toBeVisible();
    });
  });

  it('leaves the RSS feed link out when the editor switched it off', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: false }),
    );

    await setup();

    expect(
      screen.queryByRole('link', { name: 'RSS feed' }),
    ).not.toBeInTheDocument();
  });

  it('renders a mapped social link icon-only, named after its platform', async () => {
    getFooterMock.mockResolvedValue(
      okResult({
        social: [
          makeSocial(SOCIAL_PLATFORMS.LINKEDIN, 'LinkedIn', LINKEDIN_URL),
        ],
      }),
    );

    await setup();

    const link = screen.getByRole('link', { name: LINKEDIN_LABEL });

    expect(link).toHaveAttribute('href', LINKEDIN_URL);
    expect(link).toHaveAttribute('title', LINKEDIN_LABEL);
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.LINKEDIN}`),
    ).toBeVisible();
  });

  it('renders an icon-only social link for a platform outside the original 6-key set', async () => {
    getFooterMock.mockResolvedValue(
      okResult({
        social: [
          makeSocial(SOCIAL_PLATFORMS.MASTODON, 'Mastodon', MASTODON_URL),
        ],
      }),
    );

    await setup();

    const link = screen.getByRole('link', { name: 'Mastodon profile' });

    expect(link).toHaveAttribute('href', MASTODON_URL);
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).toBeVisible();
  });

  it('shows the language switcher when its toggle is on and languages are live', async () => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    expect(
      within(screen.getByRole('contentinfo')).getByRole('navigation', {
        name: 'Language',
      }),
    ).toBeVisible();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      getFooterMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      expect(screen.getByRole('link', { name: 'RSS feed' })).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'footer.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });
  });
});
