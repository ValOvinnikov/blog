import {
  COOKIE_SETTINGS_BUTTON,
  FOOTER_FINE_PRINT_KIND,
  FOOTER_LAYOUT,
  type IFooterStyle,
  LOCALE_ISO_CODES,
  routes,
  SITE_MESSAGES,
  type ILink,
} from '@blog/config';
import type { TFooter } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { FOOTER_LOG } from '@web/constants/footer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getFooterStyle } from '@web/server/site-config/get-footer-style/get-footer-style';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_FOOTER_STYLE } from '@web/testing/shared/footer-style/fixtures';
import { LANGUAGE_NAV_NAME } from '@web/testing/shared/language-switcher/constants';
import {
  MOCK_ABOUT_LINK,
  MOCK_BLOG_LINK,
  MOCK_HOME_LINK,
} from '@web/testing/shared/link/fixtures';
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

vi.mock('@web/server/site-config/get-footer-style/get-footer-style');

vi.mock('@web/server/site-config/get-brand-logo-url/get-brand-logo-url');

vi.mock(
  '@web/server/settings-features/is-capability-enabled/is-capability-enabled',
);

vi.mock('@blog/service', () => ({
  service: { global: { footer: { v1: { getFooter: getFooterMock } } } },
}));

faker.seed(6103);

const RSS_LINK_NAME = SITE_MESSAGES.rss.feedLinkLabel;
const MOCK_NOW = faker.date.future({ refDate: '2026-01-01T00:00:00Z' });

const FLOATING_COOKIE_SETTINGS_TEST_ID = 'floating-cookie-settings-button';
const COOKIE_SETTINGS_NAME = SITE_MESSAGES.consent.footerSettingsLabel;
const GROUPS_NAV_NAME = SITE_MESSAGES.siteFooter.groupsAriaLabel;
const FINE_PRINT_NAV_NAME = SITE_MESSAGES.siteFooter.finePrintAriaLabel;
const [MOCK_ABOUT, MOCK_ADDRESS, MOCK_GROUP_HEADING] =
  faker.helpers.uniqueArray(faker.lorem.word, 3);
const MOCK_LOGO_URL = faker.image.url();
const MOCK_NEW_TAB_LINK: ILink = {
  ...MOCK_ABOUT_LINK,
  href: faker.internet.url(),
  target: '_blank',
};

const mockFooter = (overrides: Partial<TFooter> = {}): TFooter => ({
  social: [],
  groups: [],
  about: undefined,
  address: undefined,
  finePrint: [],
  showRssFeed: true,
  ...overrides,
});

const linkItem = (link: ILink) => ({
  kind: FOOTER_FINE_PRINT_KIND.LINK,
  link,
});

const COOKIE_SETTINGS_ITEM = { kind: FOOTER_FINE_PRINT_KIND.COOKIE_SETTINGS };

const getRequestContextMock = vi.mocked(getRequestContext);
const getFooterStyleMock = vi.mocked(getFooterStyle);
const getBrandLogoUrlMock = vi.mocked(getBrandLogoUrl);
const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

const setup = customRenderAsync(SiteFooter, {});

const setupWithFooterStyle = async ({
  style = {},
  isConsentBannerEnabled = false,
}: {
  style?: Partial<IFooterStyle>;
  isConsentBannerEnabled?: boolean;
}) => {
  getFooterStyleMock.mockResolvedValueOnce({ ...MOCK_FOOTER_STYLE, ...style });
  isCapabilityEnabledMock.mockResolvedValueOnce(isConsentBannerEnabled);
  await setup();
};

describe(`<${SiteFooter.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCK_NOW);
    getFooterMock.mockResolvedValue(
      okResult({ social: [], showRssFeed: true }),
    );
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

  it.each(Object.values(FOOTER_LAYOUT))(
    'lays the footer out as the stored %s layout',
    async (layout) => {
      await setupWithFooterStyle({ style: { layout } });

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('data-layout', layout);
    },
  );

  it('sets the site name large in the Big wordmark layout', async () => {
    await setupWithFooterStyle({
      style: { layout: FOOTER_LAYOUT.BIG_WORDMARK },
    });

    const wordmark = screen.getByText(MOCK_SITE_SETTINGS.brand.name, {
      ignore: 'p',
    });
    expect(wordmark).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the footer Cookie settings link with the consent banner off', async () => {
    await setup();

    const footer = screen.getByRole('contentinfo');
    const cookieSettings = within(footer).getByRole('button', {
      name: COOKIE_SETTINGS_NAME,
    });

    expect(cookieSettings).toBeVisible();
  });

  describe("with the editor's footer content", () => {
    const setupWithFooter = async (overrides: Partial<TFooter>) => {
      getFooterMock.mockResolvedValue(okResult(mockFooter(overrides)));
      await setup();
    };

    const getFinePrint = () =>
      screen.getByRole('navigation', { name: FINE_PRINT_NAV_NAME });

    it('shows the brand column, the groups and the fine print in that order', async () => {
      await setupWithFooter({
        about: MOCK_ABOUT,
        address: MOCK_ADDRESS,
        groups: [{ heading: MOCK_GROUP_HEADING, links: [MOCK_HOME_LINK] }],
        finePrint: [linkItem(MOCK_BLOG_LINK)],
      });

      const footer = screen.getByRole('contentinfo');

      expect(footer).toHaveTextContent(
        new RegExp(
          `${MOCK_ABOUT}.*${MOCK_ADDRESS}.*${MOCK_GROUP_HEADING}.*${MOCK_HOME_LINK.label}.*${MOCK_BLOG_LINK.label}`,
        ),
      );
    });

    it('shows the logo when the site has one', async () => {
      getBrandLogoUrlMock.mockResolvedValueOnce(MOCK_LOGO_URL);

      await setupWithFooter({});

      const logo = screen.getByRole('presentation');
      expect(logo).toHaveAttribute('src', MOCK_LOGO_URL);
    });

    it('lists each group under its heading inside the footer links landmark', async () => {
      await setupWithFooter({
        groups: [{ heading: MOCK_GROUP_HEADING, links: [MOCK_HOME_LINK] }],
      });

      const groupsNav = screen.getByRole('navigation', {
        name: GROUPS_NAV_NAME,
      });
      const heading = within(groupsNav).getByRole('heading', {
        name: MOCK_GROUP_HEADING,
      });
      const link = within(groupsNav).getByRole('link', {
        name: MOCK_HOME_LINK.label,
      });

      expect(heading).toBeVisible();
      expect(link).toHaveAttribute('href', MOCK_HOME_LINK.href);
    });

    it('places Cookie settings where the editor put it', async () => {
      await setupWithFooter({
        finePrint: [
          COOKIE_SETTINGS_ITEM,
          linkItem(MOCK_HOME_LINK),
          linkItem(MOCK_BLOG_LINK),
        ],
      });

      expect(getFinePrint()).toHaveTextContent(
        new RegExp(
          `${COOKIE_SETTINGS_NAME}.*${MOCK_HOME_LINK.label}.*${MOCK_BLOG_LINK.label}`,
        ),
      );
    });

    it('adds Cookie settings at the end of the fine print without the Studio item', async () => {
      await setupWithFooter({ finePrint: [linkItem(MOCK_HOME_LINK)] });

      expect(getFinePrint()).toHaveTextContent(
        new RegExp(`${MOCK_HOME_LINK.label}.*${COOKIE_SETTINGS_NAME}$`),
      );
    });

    it('shows Cookie settings once when the item is set twice', async () => {
      await setupWithFooter({
        finePrint: [COOKIE_SETTINGS_ITEM, COOKIE_SETTINGS_ITEM],
      });

      const cookieSettings = within(getFinePrint()).getAllByRole('button', {
        name: COOKIE_SETTINGS_NAME,
      });
      expect(cookieSettings).toHaveLength(1);
    });

    it('skips a link whose href an earlier footer link already carries', async () => {
      await setupWithFooter({
        groups: [
          { heading: MOCK_GROUP_HEADING, links: [MOCK_HOME_LINK] },
          {
            heading: faker.lorem.word(),
            links: [MOCK_HOME_LINK, MOCK_BLOG_LINK],
          },
        ],
        finePrint: [linkItem(MOCK_BLOG_LINK)],
      });

      const homeLinks = screen.getAllByRole('link', {
        name: MOCK_HOME_LINK.label,
      });
      const finePrintLinks = within(getFinePrint()).queryAllByRole('link');

      expect(homeLinks).toHaveLength(1);
      expect(finePrintLinks).toHaveLength(0);
    });

    it('opens a link in a new tab only when its link document says so', async () => {
      await setupWithFooter({
        finePrint: [linkItem(MOCK_NEW_TAB_LINK), linkItem(MOCK_HOME_LINK)],
      });

      const newTabLink = screen.getByRole('link', {
        name: MOCK_NEW_TAB_LINK.label,
      });
      const sameTabLink = screen.getByRole('link', {
        name: MOCK_HOME_LINK.label,
      });

      expect(newTabLink).toHaveAttribute('target', '_blank');
      expect(sameTabLink).not.toHaveAttribute('target');
    });

    it('leaves out the groups landmark when no group has links', async () => {
      await setupWithFooter({});

      const groupsNav = screen.queryByRole('navigation', {
        name: GROUPS_NAV_NAME,
      });
      expect(groupsNav).not.toBeInTheDocument();
    });
  });

  describe('when the reader has answered the consent banner', () => {
    beforeEach(() => {
      grantConsent();
    });

    afterEach(clearConsentCookie);

    it('shows the floating Cookie settings button when it is Shown and the banner is on', async () => {
      await setupWithFooterStyle({
        style: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
        isConsentBannerEnabled: true,
      });

      const floatingButton = screen.getByTestId(
        FLOATING_COOKIE_SETTINGS_TEST_ID,
      );
      expect(floatingButton).toBeVisible();
    });

    it('leaves the floating button out while it is Hidden', async () => {
      await setupWithFooterStyle({ isConsentBannerEnabled: true });

      const floatingButton = screen.queryByTestId(
        FLOATING_COOKIE_SETTINGS_TEST_ID,
      );
      expect(floatingButton).not.toBeInTheDocument();
    });

    it('leaves the floating button out with the consent banner off', async () => {
      await setupWithFooterStyle({
        style: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
      });

      const floatingButton = screen.queryByTestId(
        FLOATING_COOKIE_SETTINGS_TEST_ID,
      );
      expect(floatingButton).not.toBeInTheDocument();
    });
  });

  describe('when the footer fails to load', () => {
    it('logs footer.layout_fetch_failed and renders without social links', async () => {
      getFooterMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await setup();

      const rssLink = screen.getByRole('link', { name: RSS_LINK_NAME });

      expect(rssLink).toBeVisible();
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        FOOTER_LOG.CONTENT_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
