import { LOCALE_ISO_CODES, routes, SOCIAL_PLATFORMS } from '@blog/config';
import realMessages from '@web/i18n/messages/en.json';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import type { ReactNode } from 'react';

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
  useSessionMock,
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
  useSessionMock: vi.fn(),
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

// `LocaleLayout`'s resolved tree renders a real `SessionProvider` (`AuthMenu`
// reads the session client-side — #1107). Mocked here (not just
// `useSession`) so mounting it under `render()` never fires next-auth's real
// session fetch — a plain pass-through, the same stance `auth-menu.test.tsx`
// takes on this module.
vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

const brand = { name: 'Blog', logo: null };
const now = new Date('2026-07-21T00:00:00.000Z');

// `LocaleLayout` is an async Server Component — `customRenderAsync` awaits
// it, then mounts the resolved element tree via RTL's `render()`. The real
// `en.json` messages (not a minimal stub) flow through the mocked
// `getMessages()` below so every client component nested under `Header`/
// `Footer` (`SiteNavigation`, `BrandLockupLink`, `AuthMenu`, ...) finds its
// own namespace on the real `NextIntlClientProvider` `LocaleLayout` renders,
// instead of throwing/falling back on a missing-message error.
const setup = customRenderAsync(LocaleLayout, {
  children: <div>content</div>,
  params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
});

describe('LocaleLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand, description: 'A blog' },
    });
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getFooterMock.mockResolvedValue({ ok: true, data: { social: [] } });
    getMessagesMock.mockResolvedValue(realMessages);
    getNowMock.mockResolvedValue(now);
    getTimeZoneMock.mockResolvedValue('UTC');
    getTranslationsMock.mockResolvedValue(
      (key: string) => rssTranslations[key] ?? key,
    );
    isProductionEnvironmentMock.mockReturnValue(true);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
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

  // This one still calls `LocaleLayout` directly and reads props off the
  // resolved root element — it asserts what's actually passed to
  // `NextIntlClientProvider`, which has no rendered-DOM equivalent to query
  // for. Unlike the footer-nav tests below, this is a single hop on the root
  // element, not a `.props.children` chain walk, so it's left as-is.
  it('passes real messages, locale, now, and timeZone to NextIntlClientProvider', async () => {
    const ui = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({ locale: LOCALE_ISO_CODES.EN }),
    });

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(ui.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(ui.props.messages).toBe(realMessages);
    expect(ui.props.now).toBe(now);
    expect(ui.props.timeZone).toBe('UTC');
  });

  it('adds a visible RSS feed link to the footer nav', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'RSS feed' });

    expect(link).toHaveAttribute('href', routes.rssFeed());
    // `hideLabel` sets the link's `title` to its own label text (see
    // `NavLink`) — the one DOM-observable trace of that prop being `true`.
    expect(link).toHaveAttribute('title', 'RSS feed');
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

    await setup();

    const link = screen.getByRole('link', { name: 'LinkedIn' });

    expect(link).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/example',
    );
    // A mapped platform renders icon-only (`hideLabel`), traced the same way
    // as the RSS link above.
    expect(link).toHaveAttribute('title', 'LinkedIn');
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

    await setup();

    const link = screen.getByRole('link', { name: 'Mastodon' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    // An unmapped platform never sets `hideLabel` — no icon, and no `title`
    // since the visible label text is already the accessible name.
    expect(link).not.toHaveAttribute('title');
  });
});
