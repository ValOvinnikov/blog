import { LOCALE_ISO_CODES, routes, SITE_MESSAGES } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { LANGUAGE_NAV_NAME } from '@web/testing/shared/language-switcher/constants';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_LINKEDIN_PROFILE,
  MOCK_MASTODON_PROFILE,
} from '@web/testing/shared/social-profile/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { SiteFooter } from './site-footer';

const { getFooterMock } = vi.hoisted(() => ({
  getFooterMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock(
  '@web/server/site-config/get-language-switcher-style/get-language-switcher-style',
);

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@blog/service', () => ({
  service: { global: { footer: { v1: { getFooter: getFooterMock } } } },
}));

const RSS_LINK_NAME = SITE_MESSAGES.rss.feedLinkLabel;

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(SiteFooter, {});

describe(`<${SiteFooter.name}/>`, () => {
  beforeEach(() => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: true }),
    );
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
      expect(footer).toHaveTextContent(String(new Date().getFullYear()));
    });

    it('adds a visible RSS feed link to the footer nav', () => {
      const link = screen.getByRole('link', { name: RSS_LINK_NAME });
      const rssIcon = within(link).getByTestId('rss-icon');

      expect(link).toHaveAttribute('href', routes.rssFeed());
      expect(link).toHaveAttribute('title', RSS_LINK_NAME);
      expect(rssIcon).toBeVisible();
    });
  });

  it('leaves the RSS feed link out when the editor switched it off', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: false }),
    );

    await setup();

    const rssLink = screen.queryByRole('link', { name: RSS_LINK_NAME });

    expect(rssLink).not.toBeInTheDocument();
  });

  it.each([MOCK_LINKEDIN_PROFILE, MOCK_MASTODON_PROFILE])(
    'renders the $platform social link icon-only, named after its platform',
    async (profile) => {
      getFooterMock.mockResolvedValue(okResult({ social: [profile] }));

      await setup();

      const linkName = `${profile.link.label} profile`;
      const link = screen.getByRole('link', { name: linkName });
      const icon = within(link).getByTestId(`social-icon-${profile.platform}`);

      expect(link).toHaveAttribute('href', profile.link.href);
      expect(link).toHaveAttribute('title', linkName);
      expect(icon).toBeVisible();
    },
  );

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
      name: LANGUAGE_NAV_NAME,
    });

    expect(languageNav).toBeVisible();
  });

  it('shows no language switcher with one live language, whatever the toggle says', async () => {
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showLanguageSwitcher: true }),
    );

    await setup();

    const languageNav = screen.queryByRole('navigation', {
      name: LANGUAGE_NAV_NAME,
    });

    expect(languageNav).not.toBeInTheDocument();
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      getFooterMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const rssLink = screen.getByRole('link', { name: RSS_LINK_NAME });

      expect(rssLink).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'footer.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });
  });
});
