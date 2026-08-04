import {
  ICONS,
  LOCALE_ISO_CODES,
  routes,
  SOCIAL_PLATFORMS,
} from '@blog/config';

import LocaleLayout, { generateMetadata, generateStaticParams } from './layout';

const {
  getSiteSettingsMock,
  getNavigationMock,
  getFooterMock,
  getMessagesMock,
  getNowMock,
  getTimeZoneMock,
  getTranslationsMock,
  setRequestLocaleMock,
  isProductionEnvironmentMock,
} = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
  getNavigationMock: vi.fn(),
  getFooterMock: vi.fn(),
  getMessagesMock: vi.fn(),
  getNowMock: vi.fn(),
  getTimeZoneMock: vi.fn(),
  getTranslationsMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
      navigation: { v1: { getNavigation: getNavigationMock } },
      footer: { v1: { getFooter: getFooterMock } },
    },
  },
}));

const rssTranslations: Record<string, string> = {
  feedLinkLabel: 'RSS feed',
};

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  getNow: getNowMock,
  getTimeZone: getTimeZoneMock,
  getTranslations: getTranslationsMock,
  setRequestLocale: setRequestLocaleMock,
}));

vi.mock('@web/i18n/navigation', () => ({
  usePathname: vi.fn(),
}));

const brand = { name: 'Blog', logo: null };
const now = new Date('2026-07-21T00:00:00.000Z');
const messages = { pagination: { previous: 'Previous' } };

describe('LocaleLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand, description: 'A blog' },
    });
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getFooterMock.mockResolvedValue({ ok: true, data: { social: [] } });
    getMessagesMock.mockResolvedValue(messages);
    getNowMock.mockResolvedValue(now);
    getTimeZoneMock.mockResolvedValue('UTC');
    getTranslationsMock.mockResolvedValue(
      (key: string) => rssTranslations[key] ?? key,
    );
    isProductionEnvironmentMock.mockReturnValue(true);
  });

  describe('generateStaticParams', () => {
    it('returns params for every supported locale', () => {
      expect(generateStaticParams()).toEqual([{ locale: LOCALE_ISO_CODES.EN }]);
    });
  });

  describe('generateMetadata', () => {
    it('builds title and description from site settings', async () => {
      const metadata = await generateMetadata();

      expect(metadata).toEqual(
        expect.objectContaining({
          title: { default: 'Blog', template: '%s | Blog' },
          description: 'A blog',
        }),
      );
    });

    it('falls back to metadataBase only when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      const metadata = await generateMetadata();

      expect(metadata).not.toHaveProperty('title');
      errorSpy.mockRestore();
    });

    it('omits robots restrictions in production (indexable)', async () => {
      isProductionEnvironmentMock.mockReturnValue(true);

      const metadata = await generateMetadata();

      expect(metadata).not.toHaveProperty('robots');
    });

    it('adds noindex, nofollow robots metadata outside production', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);

      const metadata = await generateMetadata();

      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('still applies noindex, nofollow outside production when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      isProductionEnvironmentMock.mockReturnValue(false);
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      const metadata = await generateMetadata();

      expect(metadata.robots).toEqual({ index: false, follow: false });
      errorSpy.mockRestore();
    });
  });

  it('passes real messages, locale, now, and timeZone to NextIntlClientProvider', async () => {
    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(ui.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(ui.props.messages).toBe(messages);
    expect(ui.props.now).toBe(now);
    expect(ui.props.timeZone).toBe('UTC');
  });

  it('adds a visible RSS feed link to the footer nav', async () => {
    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    // `ui.props.children` is now `<SessionProvider>` (#1107) — one more
    // `.props.children` hop than before to reach the root div's own children.
    const [, , footer] = ui.props.children.props.children.props.children;
    const [, footerNav] = footer.props.children;
    const footerNavLinks = footerNav.props.children;
    const rssLink = footerNavLinks[footerNavLinks.length - 1];

    expect(rssLink.props.href).toBe(routes.rssFeed());
    expect(rssLink.props.hideLabel).toBe(true);
    expect(rssLink.props.children).toBe('RSS feed');
    expect(rssLink.props.icon.props.name).toBe(ICONS.RSS);
  });

  it('renders a mapped social link icon-only, keeping its label as the accessible name', async () => {
    getFooterMock.mockResolvedValue({
      ok: true,
      data: {
        social: [
          {
            label: 'LinkedIn',
            href: 'https://www.linkedin.com/in/example',
            target: '_blank',
            platform: SOCIAL_PLATFORMS.LINKEDIN,
          },
        ],
      },
    });

    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    // `ui.props.children` is now `<SessionProvider>` (#1107) — one more
    // `.props.children` hop than before to reach the root div's own children.
    const [, , footer] = ui.props.children.props.children.props.children;
    const [, footerNav] = footer.props.children;
    const [[socialLink]] = footerNav.props.children;

    expect(socialLink.props.hideLabel).toBe(true);
    expect(socialLink.props.children).toBe('LinkedIn');
    expect(socialLink.props.icon.props.name).toBe(ICONS.LINKEDIN);
  });

  it('falls back to label-only rendering for a social link with an unmapped platform', async () => {
    getFooterMock.mockResolvedValue({
      ok: true,
      data: {
        social: [
          {
            label: 'Mastodon',
            href: 'https://mastodon.social/@example',
            target: '_blank',
            platform: SOCIAL_PLATFORMS.MASTODON,
          },
        ],
      },
    });

    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    // `ui.props.children` is now `<SessionProvider>` (#1107) — one more
    // `.props.children` hop than before to reach the root div's own children.
    const [, , footer] = ui.props.children.props.children.props.children;
    const [, footerNav] = footer.props.children;
    const [[socialLink]] = footerNav.props.children;

    expect(socialLink.props.hideLabel).toBe(false);
    expect(socialLink.props.icon).toBeUndefined();
    expect(socialLink.props.children).toBe('Mastodon');
  });
});
