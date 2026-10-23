import { LOCALE_ISO_CODES, routes, SOCIAL_PLATFORMS } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_LINKEDIN_PROFILE,
  MOCK_MASTODON_PROFILE,
} from '@web/testing/shared/social-profile/fixtures';
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

const setup = customRenderAsync(SiteFooter, {});

describe(SiteFooter, () => {
  beforeEach(() => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: true }),
    );
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

      expect(footer).toHaveTextContent(MOCK_SITE_SETTINGS.brand.name);
      expect(footer).toHaveTextContent(String(new Date().getFullYear()));
    });

    it('adds a visible RSS feed link to the footer nav', async () => {
      const link = screen.getByRole('link', { name: 'RSS feed' });
      const rssIcon = within(link).getByTestId('rss-icon');

      expect(link).toHaveAttribute('href', routes.rssFeed());
      expect(link).toHaveAttribute('title', 'RSS feed');
      expect(rssIcon).toBeVisible();
    });
  });

  it('leaves the RSS feed link out when the editor switched it off', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: false }),
    );

    await setup();

    const rssLink = screen.queryByRole('link', { name: 'RSS feed' });

    expect(rssLink).not.toBeInTheDocument();
  });

  it('renders a mapped social link icon-only, named after its platform', async () => {
    getFooterMock.mockResolvedValue(
      okResult({
        social: [MOCK_LINKEDIN_PROFILE],
      }),
    );

    await setup();

    const linkName = `${MOCK_LINKEDIN_PROFILE.link.label} profile`;
    const link = screen.getByRole('link', { name: linkName });
    const icon = within(link).getByTestId(
      `social-icon-${SOCIAL_PLATFORMS.LINKEDIN}`,
    );

    expect(link).toHaveAttribute('href', MOCK_LINKEDIN_PROFILE.link.href);
    expect(link).toHaveAttribute('title', linkName);
    expect(icon).toBeVisible();
  });

  it('renders an icon-only social link for a platform outside the original 6-key set', async () => {
    getFooterMock.mockResolvedValue(
      okResult({
        social: [MOCK_MASTODON_PROFILE],
      }),
    );

    await setup();

    const link = screen.getByRole('link', {
      name: `${MOCK_MASTODON_PROFILE.link.label} profile`,
    });
    const icon = within(link).getByTestId(
      `social-icon-${SOCIAL_PLATFORMS.MASTODON}`,
    );

    expect(link).toHaveAttribute('href', MOCK_MASTODON_PROFILE.link.href);
    expect(icon).toBeVisible();
  });

  it('shows the language switcher when its toggle is on and languages are live', async () => {
    getRequestContextMock.mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    const footer = screen.getByRole('contentinfo');
    const languageNav = within(footer).getByRole('navigation', {
      name: 'Language',
    });

    expect(languageNav).toBeVisible();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    const languageNav = screen.queryByRole('navigation', { name: 'Language' });

    expect(languageNav).not.toBeInTheDocument();
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      getFooterMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const rssLink = screen.getByRole('link', { name: 'RSS feed' });

      expect(rssLink).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'footer.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });
  });
});
