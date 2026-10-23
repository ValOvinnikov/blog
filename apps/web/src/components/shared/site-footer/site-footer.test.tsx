import {
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_ISO_CODES,
  routes,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_NOW } from '@web/testing/shared/now/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
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

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

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

const RSS_FEED = 'RSS feed';
const LANGUAGE_NAV = 'Language';

describe(`<${SiteFooter.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW, shouldAdvanceTime: true });
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: true }),
    );
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
    getTranslationsMock.mockResolvedValue(translate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with the default footer', () => {
    beforeEach(async () => {
      await setup();
    });

    it('forwards the tenant Sanity context to the footer loader', () => {
      expect(getFooterMock).toHaveBeenCalledWith(
        MOCK_REQUEST_CONTEXT.sanityContext,
      );
    });

    it('shows the brand name and the current year in the copyright', () => {
      const footer = screen.getByRole('contentinfo');

      expect(footer).toHaveTextContent(MOCK_SITE_SETTINGS.brand.name);
      expect(footer).toHaveTextContent(String(MOCK_NOW.getFullYear()));
    });

    it('adds a visible RSS feed link to the footer nav', () => {
      const link = screen.getByRole('link', { name: RSS_FEED });
      const icon = within(link).getByTestId('rss-icon');

      expect(link).toHaveAttribute('href', routes.rssFeed());
      expect(link).toHaveAttribute('title', RSS_FEED);
      expect(icon).toBeVisible();
    });
  });

  it('leaves the RSS feed link out when the editor switched it off', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: false }),
    );

    await setup();

    const link = screen.queryByRole('link', { name: RSS_FEED });
    expect(link).not.toBeInTheDocument();
  });

  it.each([
    [
      SOCIAL_PLATFORMS.LINKEDIN,
      'LinkedIn',
      'https://www.linkedin.com/in/example',
    ],
    [SOCIAL_PLATFORMS.MASTODON, 'Mastodon', 'https://mastodon.social/@example'],
  ])(
    'renders a %s social link icon-only, named after its platform',
    async (platform, label, href) => {
      getFooterMock.mockResolvedValue(
        okResult({ social: [makeSocial(platform, label, href)] }),
      );

      await setup();

      const link = screen.getByRole('link', { name: `${label} profile` });
      const icon = within(link).getByTestId(`social-icon-${platform}`);

      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('title', `${label} profile`);
      expect(icon).toBeVisible();
    },
  );

  it('shows the language switcher when toggled on with several live languages', async () => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    const footer = screen.getByRole('contentinfo');
    const switcher = within(footer).getByRole('navigation', {
      name: LANGUAGE_NAV,
    });
    expect(switcher).toBeVisible();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    const switcher = screen.queryByRole('navigation', { name: LANGUAGE_NAV });
    expect(switcher).not.toBeInTheDocument();
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      getFooterMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const rssLink = screen.getByRole('link', { name: RSS_FEED });
      expect(rssLink).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'footer.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });
  });
});
