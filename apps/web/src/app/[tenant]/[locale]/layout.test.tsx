import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  routes,
  SITE_MESSAGES as realMessages,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import userEvent from '@testing-library/user-event';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';

import LocaleLayout, { generateMetadata, generateStaticParams } from './layout';

type TAnyElement = ReactElement<Record<string, unknown>>;

const childrenOf = (node: TAnyElement): TAnyElement[] => {
  const props = node.props as { children?: TAnyElement | TAnyElement[] };
  return [props.children ?? []].flat();
};

const firstChildOf = (node: TAnyElement): TAnyElement =>
  childrenOf(node)[0] as TAnyElement;

const {
  getSiteSettingsMock,
  getNavigationMock,
  getFooterMock,
  getThemeTokensMock,
  isWebAnalyticsEnabledMock,
  resolveTenantMessagesMock,
  getMessagesMock,
  getNowMock,
  getTimeZoneMock,
  getTranslationsMock,
  isProductionEnvironmentMock,
  useSessionMock,
  getEnabledOAuthProviderIdsMock,

  getSanityImageBaseUrlMock,
  urlForSanityImageMock,
} = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
  getNavigationMock: vi.fn(),
  getFooterMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  isWebAnalyticsEnabledMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
  getMessagesMock: vi.fn(),
  getNowMock: vi.fn(),
  getTimeZoneMock: vi.fn(),
  getTranslationsMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  useSessionMock: vi.fn(),
  getEnabledOAuthProviderIdsMock: vi.fn(),
  getSanityImageBaseUrlMock: vi.fn(),
  urlForSanityImageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: vi.fn(),
}));

vi.mock('@blog/auth/utils/oauth-providers/oauth-providers', () => ({
  getEnabledOAuthProviderIds: getEnabledOAuthProviderIdsMock,
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

vi.mock('@web/utils/is-web-analytics-enabled', () => ({
  isWebAnalyticsEnabled: isWebAnalyticsEnabledMock,
}));

vi.mock('@web/utils/resolve-tenant-messages', () => ({
  resolveTenantMessages: resolveTenantMessagesMock,
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
      navigation: { v1: { getNavigation: getNavigationMock } },
      footer: { v1: { getFooter: getFooterMock } },
    },
  },
  getSanityImageBaseUrl: getSanityImageBaseUrlMock,
  urlForSanityImage: urlForSanityImageMock,
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

vi.mock('next-intl/server', () => ({
  getMessages: getMessagesMock,
  getNow: getNowMock,
  getTimeZone: getTimeZoneMock,
  getTranslations: getTranslationsMock,
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

const enterRequestContextMock = vi.mocked(enterRequestContext);
const getRequestContextMock = vi.mocked(getRequestContext);
const isCapabilityEnabledMock = vi.mocked(isCapabilityEnabled);

const withRequestContext = (
  overrides: Partial<typeof DEFAULT_REQUEST_CONTEXT>,
) =>
  getRequestContextMock.mockResolvedValue({
    ...DEFAULT_REQUEST_CONTEXT,
    ...overrides,
  });

const brand = { name: 'Blog', logo: undefined };
const now = new Date('2026-07-21T00:00:00.000Z');

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
};

const setup = customRenderAsync(LocaleLayout, {
  children: <div>content</div>,
  params: Promise.resolve({
    tenant: 'tenant-1',
    locale: LOCALE_ISO_CODES.EN,
  }),
});

describe('LocaleLayout', () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand, description: 'A blog' },
    });
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getFooterMock.mockResolvedValue({ ok: true, data: { social: [] } });
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    isCapabilityEnabledMock.mockResolvedValue(true);
    isWebAnalyticsEnabledMock.mockReturnValue(false);
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    resolveTenantMessagesMock.mockImplementation((messages: unknown) =>
      Promise.resolve({ messages, rich: {} }),
    );
    getMessagesMock.mockResolvedValue(realMessages);
    getNowMock.mockResolvedValue(now);
    getTimeZoneMock.mockResolvedValue('UTC');
    getTranslationsMock.mockResolvedValue(translate);
    isProductionEnvironmentMock.mockReturnValue(true);
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github', 'google']);
    getSanityImageBaseUrlMock.mockReturnValue(
      'https://cdn.sanity.io/images/mock-project/mock-dataset/',
    );
  });

  describe('generateStaticParams', () => {
    it('returns params for every supported locale', () => {
      expect(generateStaticParams()).toEqual([{ locale: LOCALE_ISO_CODES.EN }]);
    });
  });

  describe('generateMetadata', () => {
    it('builds title from site settings and emits no description', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata).toEqual(
        expect.objectContaining({
          title: { default: 'Blog', template: '%s | Blog' },
        }),
      );
      expect(metadata).not.toHaveProperty('description');
    });

    it('falls back to metadataBase only when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata).not.toHaveProperty('title');
      errorSpy.mockRestore();
    });

    it('omits robots restrictions in production (indexable)', async () => {
      isProductionEnvironmentMock.mockReturnValue(true);

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata).not.toHaveProperty('robots');
    });

    it('adds noindex, nofollow robots metadata outside production', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('still applies noindex, nofollow outside production when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      isProductionEnvironmentMock.mockReturnValue(false);
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata.robots).toEqual({ index: false, follow: false });
      errorSpy.mockRestore();
    });

    it('enters the request context from its route params', async () => {
      const params = Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      });

      await generateMetadata({ params });

      expect(enterRequestContextMock).toHaveBeenCalledWith(params);
    });

    it("sets metadataBase to the tenant's base URL", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(metadata.metadataBase).toBe(DEFAULT_REQUEST_CONTEXT.metadataBase);
    });
  });

  it('passes real messages, locale, now, and timeZone to NextIntlClientProvider', async () => {
    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    const sanityImageBaseUrlProvider = firstChildOf(themeScope);
    const provider = firstChildOf(sanityImageBaseUrlProvider);

    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(provider.props.messages).toBe(realMessages);
    expect(provider.props.now).toBe(now);
    expect(provider.props.timeZone).toBe('UTC');
  });

  it('applies the tenant voice pack to the base messages before rendering', async () => {
    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
      realMessages,
      'tenant-1',
    );
    const sanityImageBaseUrlProvider = firstChildOf(themeScope);
    const provider = firstChildOf(sanityImageBaseUrlProvider);
    expect(provider.props.messages).toBe(realMessages);
  });

  it("serves another language's messages without the tenant's default-language voice pack", async () => {
    withRequestContext({ locale: LOCALE_ISO_CODES.NL });
    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.NL,
        }),
      }),
    );

    expect(resolveTenantMessagesMock).not.toHaveBeenCalled();
    const sanityImageBaseUrlProvider = firstChildOf(themeScope);
    const provider = firstChildOf(sanityImageBaseUrlProvider);
    expect(provider.props.messages).toBe(realMessages);
  });

  it('declares the served language on the document', async () => {
    withRequestContext({ locale: LOCALE_ISO_CODES.NL });
    const document = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.NL,
      }),
    });

    expect(document.props.lang).toBe(LOCALE_BCP47_TAGS.NL);
  });

  it('mounts VoiceRichProvider with the rich voice values from resolveTenantMessages', async () => {
    const rich = { blogListEmpty: [{ _type: 'block' }] };
    resolveTenantMessagesMock.mockResolvedValue({
      messages: realMessages,
      rich,
    });

    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    const sanityImageBaseUrlProvider = firstChildOf(themeScope);
    const provider = firstChildOf(sanityImageBaseUrlProvider);
    const sessionProvider = firstChildOf(provider);
    const toastProvider = firstChildOf(sessionProvider);
    const voiceRichProvider = firstChildOf(toastProvider);

    expect(voiceRichProvider.type).toBe(VoiceRichProvider);
    expect(voiceRichProvider.props.values).toBe(rich);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    expect(themeScope.type).toBe(ThemeScope);
    expect(themeScope.props.themeTokens).toBe(THEME_TOKENS);
  });

  it('omits Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is unset', async () => {
    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    const children = childrenOf(themeScope);

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(false);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('mounts Analytics and SpeedInsights when enabled and the capability is entitled', async () => {
    isWebAnalyticsEnabledMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(true);

    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    const children = childrenOf(themeScope);

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(true);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(true);
  });

  it('omits Analytics and SpeedInsights when the ANALYTICS capability is not entitled', async () => {
    isWebAnalyticsEnabledMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(false);

    const themeScope = firstChildOf(
      await LocaleLayout({
        children: <div>content</div>,
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      }),
    );

    const children = childrenOf(themeScope);

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(false);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('shows the language switcher in the header when its toggle is on', async () => {
    withRequestContext({
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getNavigationMock.mockResolvedValue({
      ok: true,
      data: { items: [], showLanguageSwitcher: true },
    });
    await setup();

    expect(
      within(screen.getByRole('banner')).getByRole('navigation', {
        name: 'Language',
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('contentinfo')).queryByRole('navigation', {
        name: 'Language',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows the language switcher in the footer when its toggle is on', async () => {
    withRequestContext({
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
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).queryByRole('navigation', {
        name: 'Language',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows no language switcher with one live language, whatever the toggles say', async () => {
    getNavigationMock.mockResolvedValue({
      ok: true,
      data: { items: [], showLanguageSwitcher: true },
    });
    getFooterMock.mockResolvedValue({
      ok: true,
      data: { social: [], showLanguageSwitcher: true },
    });
    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Language' }),
    ).not.toBeInTheDocument();
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
          {
            platform: SOCIAL_PLATFORMS.LINKEDIN,
            link: {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/example',
              target: '_blank',
              platform: undefined,
              ariaLabel: undefined,
            },
          },
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
          {
            platform: SOCIAL_PLATFORMS.MASTODON,
            link: {
              label: 'Mastodon',
              href: 'https://mastodon.social/@example',
              target: '_blank',
              platform: undefined,
              ariaLabel: undefined,
            },
          },
        ],
      },
    });

    await setup();

    const link = screen.getByRole('link', { name: 'Mastodon profile' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(link).toHaveAttribute('title', 'Mastodon profile');
    expect(
      within(link).getByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).toBeVisible();
  });

  it('passes the enabled OAuth provider ids into AuthMenu', async () => {
    getEnabledOAuthProviderIdsMock.mockReturnValue(['github']);

    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const panel = screen.getByRole('menu');

    expect(
      within(panel).getByRole('menuitem', { name: 'Continue with GitHub' }),
    ).toBeVisible();
    expect(
      within(panel).queryByRole('menuitem', { name: 'Continue with Google' }),
    ).not.toBeInTheDocument();
  });

  it('forwards the tenant Sanity context to the settings, nav and footer loaders', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    withRequestContext({ sanityContext: tenant });

    await setup();

    expect(getSiteSettingsMock).toHaveBeenCalledWith(tenant);
    expect(getNavigationMock).toHaveBeenCalledWith(tenant);
    expect(getFooterMock).toHaveBeenCalledWith(tenant);
  });

  it('forwards the entered tenant to every tenant-scoped loader', async () => {
    await setup();

    expect(getThemeTokensMock).toHaveBeenCalledWith('tenant-1');
    expect(isCapabilityEnabledMock).toHaveBeenCalledWith('ANALYTICS');
    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
      realMessages,
      'tenant-1',
    );
  });

  describe('when site settings fail to load', () => {
    it('calls the real Next.js notFound() instead of rendering a broken shell', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    });

    it('preserves the site_settings.layout_fetch_failed log call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      await expect(setup()).rejects.toThrow();

      expect(
        errorSpy.mock.calls.some((call) =>
          call.some(
            (arg) =>
              typeof arg === 'string' &&
              arg.includes('site_settings.layout_fetch_failed'),
          ),
        ),
      ).toBe(true);
      errorSpy.mockRestore();
    });

    it('enters the request context ahead of the notFound() it throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(enterRequestContextMock.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(notFound).mock.invocationCallOrder[0]!,
      );
      errorSpy.mockRestore();
    });
  });

  describe('when navigation fails to load', () => {
    it('preserves the navigation.layout_fetch_failed log call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getNavigationMock.mockResolvedValue({ ok: false, error: 'boom' });

      await setup();

      expect(
        errorSpy.mock.calls.some((call) =>
          call.some(
            (arg) =>
              typeof arg === 'string' &&
              arg.includes('navigation.layout_fetch_failed'),
          ),
        ),
      ).toBe(true);
      errorSpy.mockRestore();
    });
  });

  describe('when the footer fails to load', () => {
    it('preserves the footer.layout_fetch_failed log call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getFooterMock.mockResolvedValue({ ok: false, error: 'boom' });

      await setup();

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
