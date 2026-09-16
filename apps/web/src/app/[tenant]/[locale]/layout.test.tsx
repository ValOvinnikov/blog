import {
  LOCALE_ISO_CODES,
  routes,
  SITE_MESSAGES as realMessages,
  SOCIAL_PLATFORMS,
  type TLocaleIsoCode,
} from '@blog/config';
import userEvent from '@testing-library/user-event';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import LocaleLayout, { generateMetadata, generateStaticParams } from './layout';

const {
  getSiteSettingsMock,
  getNavigationMock,
  getFooterMock,
  getThemeTokensMock,
  isCapabilityEnabledMock,
  isWebAnalyticsEnabledMock,
  resolveTenantMessagesMock,
  getMessagesMock,
  getNowMock,
  getTimeZoneMock,
  getTranslationsMock,
  setRequestLocaleMock,
  isProductionEnvironmentMock,
  useSessionMock,
  getEnabledOAuthProviderIdsMock,
  getTenantSanityContextMock,
  getTenantBaseUrlMock,
  getSanityImageBaseUrlMock,
  urlForSanityImageMock,
  rememberRequestTenantIdMock,
} = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
  getNavigationMock: vi.fn(),
  getFooterMock: vi.fn(),
  getThemeTokensMock: vi.fn(),
  isCapabilityEnabledMock: vi.fn(),
  isWebAnalyticsEnabledMock: vi.fn(),
  resolveTenantMessagesMock: vi.fn(),
  getMessagesMock: vi.fn(),
  getNowMock: vi.fn(),
  getTimeZoneMock: vi.fn(),
  getTranslationsMock: vi.fn(),
  setRequestLocaleMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  useSessionMock: vi.fn(),
  getEnabledOAuthProviderIdsMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  getSanityImageBaseUrlMock: vi.fn(),
  urlForSanityImageMock: vi.fn(),
  rememberRequestTenantIdMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
}));

vi.mock('@web/server/tenant/remembered-tenant', () => ({
  rememberRequestTenantId: rememberRequestTenantIdMock,
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

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: isCapabilityEnabledMock,
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
  socialLinkAriaLabel: '{platform} profile',
};

// A minimal stand-in for next-intl's ICU interpolation — sufficient for the
// one `{platform}` placeholder this file's messages use.
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
  setRequestLocale: setRequestLocaleMock,
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

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
    vi.clearAllMocks();
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand, description: 'A blog' },
    });
    getNavigationMock.mockResolvedValue({ ok: true, data: { items: [] } });
    getFooterMock.mockResolvedValue({ ok: true, data: { social: [] } });
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    isCapabilityEnabledMock.mockResolvedValue(true);
    isWebAnalyticsEnabledMock.mockReturnValue(false);
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
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
    getTenantBaseUrlMock.mockResolvedValue(undefined);
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

    it('forwards the tenant route param to getTenantSanityContext and getTenantBaseUrl', async () => {
      await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: LOCALE_ISO_CODES.EN,
        }),
      });

      expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
      expect(getTenantBaseUrlMock).toHaveBeenCalledWith('tenant-1');
    });
  });

  // The resolved tree's root is `ThemeScope`, whose `children` is
  // `NextIntlClientProvider` followed by the conditional analytics components.
  it('passes real messages, locale, now, and timeZone to NextIntlClientProvider', async () => {
    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    const [sanityImageBaseUrlProvider] = html.props.children;
    const provider = sanityImageBaseUrlProvider.props.children;

    expect(setRequestLocaleMock).toHaveBeenCalledWith(LOCALE_ISO_CODES.EN);
    expect(provider.props.locale).toBe(LOCALE_ISO_CODES.EN);
    expect(provider.props.messages).toBe(realMessages);
    expect(provider.props.now).toBe(now);
    expect(provider.props.timeZone).toBe('UTC');
  });

  it('applies the tenant voice pack to the base messages before rendering', async () => {
    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    expect(resolveTenantMessagesMock).toHaveBeenCalledWith(
      realMessages,
      'tenant-1',
    );
    const [sanityImageBaseUrlProvider] = html.props.children;
    const provider = sanityImageBaseUrlProvider.props.children;
    expect(provider.props.messages).toBe(realMessages);
  });

  it('mounts VoiceRichProvider with the rich voice values resolved by resolveTenantMessages', async () => {
    const rich = { blogListEmpty: [{ _type: 'block' }] };
    resolveTenantMessagesMock.mockResolvedValue({
      messages: realMessages,
      rich,
    });

    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    const [sanityImageBaseUrlProvider] = html.props.children;
    const provider = sanityImageBaseUrlProvider.props.children;
    const sessionProvider = provider.props.children;
    const toastProvider = sessionProvider.props.children;
    const voiceRichProvider = toastProvider.props.children;

    expect(voiceRichProvider.type).toBe(VoiceRichProvider);
    expect(voiceRichProvider.props.values).toBe(rich);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    expect(html.type).toBe(ThemeScope);
    expect(html.props.themeTokens).toBe(THEME_TOKENS);
  });

  it('omits Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is unset', async () => {
    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    const children = [html.props.children].flat();

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(false);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('mounts Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is enabled and the capability is entitled', async () => {
    isWebAnalyticsEnabledMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(true);

    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    const children = [html.props.children].flat();

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(true);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(true);
  });

  it('omits Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is enabled but the ANALYTICS capability is not entitled/enabled', async () => {
    isWebAnalyticsEnabledMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(false);

    const html = await LocaleLayout({
      children: <div>content</div>,
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: LOCALE_ISO_CODES.EN,
      }),
    });

    const children = [html.props.children].flat();

    expect(
      children.some((child: React.ReactElement) => child?.type === Analytics),
    ).toBe(false);
    expect(
      children.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('adds a visible RSS feed link to the footer nav', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'RSS feed' });

    expect(link).toHaveAttribute('href', routes.rssFeed());
    expect(link).toHaveAttribute('title', 'RSS feed');
    expect(within(link).getByTestId('rss-icon')).toBeVisible();
  });

  it('renders a mapped social link icon-only, with an accessible name derived from its platform', async () => {
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

  it('falls back to label-only rendering for a social link with an unmapped platform', async () => {
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

    const link = screen.getByRole('link', { name: 'Mastodon' });

    expect(link).toHaveAttribute('href', 'https://mastodon.social/@example');
    expect(link).not.toHaveAttribute('title');
    expect(
      within(link).queryByTestId(`social-icon-${SOCIAL_PLATFORMS.MASTODON}`),
    ).not.toBeInTheDocument();
  });

  it('wires the enabled OAuth provider ids from getEnabledOAuthProviderIds into AuthMenu', async () => {
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

  it('forwards the resolved tenant Sanity context to getSiteSettings, getNavigation, and getFooter', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);

    await setup();

    expect(getSiteSettingsMock).toHaveBeenCalledWith(tenant);
    expect(getNavigationMock).toHaveBeenCalledWith(tenant);
    expect(getFooterMock).toHaveBeenCalledWith(tenant);
  });

  it('forwards the tenant route param to getTenantSanityContext, getThemeTokens, isCapabilityEnabled, and resolveTenantMessages', async () => {
    await setup();

    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
    expect(getThemeTokensMock).toHaveBeenCalledWith('tenant-1');
    expect(isCapabilityEnabledMock).toHaveBeenCalledWith(
      'ANALYTICS',
      'tenant-1',
    );
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

    it('remembers the tenant id ahead of the notFound() it throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });

      await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(rememberRequestTenantIdMock).toHaveBeenCalledWith('tenant-1');
      expect(
        rememberRequestTenantIdMock.mock.invocationCallOrder[0],
      ).toBeLessThan(vi.mocked(notFound).mock.invocationCallOrder[0]!);
      errorSpy.mockRestore();
    });
  });

  describe('when navigation fails to load', () => {
    it('logs navigation.layout_fetch_failed and renders with an empty nav', async () => {
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
    it('logs footer.layout_fetch_failed and renders with no social links', async () => {
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

  describe('when the locale is invalid', () => {
    it('remembers the tenant id before calling notFound()', async () => {
      await expect(
        LocaleLayout({
          children: <div>content</div>,
          params: Promise.resolve({
            tenant: 'tenant-1',
            locale: 'xx' as unknown as TLocaleIsoCode,
          }),
        }),
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(rememberRequestTenantIdMock).toHaveBeenCalledWith('tenant-1');
      expect(
        rememberRequestTenantIdMock.mock.invocationCallOrder[0],
      ).toBeLessThan(vi.mocked(notFound).mock.invocationCallOrder[0]!);
    });
  });
});
