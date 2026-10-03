import {
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config';
import { SiteAnalytics } from '@web/components/shared/site-analytics';
import { SiteFooter } from '@web/components/shared/site-footer';
import { SiteHeader } from '@web/components/shared/site-header';
import { SiteProviders } from '@web/components/shared/site-providers';
import { ThemeScope } from '@web/components/shared/theme-scope';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import LocaleLayout, { generateMetadata, generateStaticParams } from './layout';

type TAnyElement = ReactElement<Record<string, unknown>>;

const childrenOf = (node: TAnyElement): TAnyElement[] => {
  const props = node.props as { children?: TAnyElement | TAnyElement[] };
  return [props.children ?? []].flat();
};

const { getThemeTokensMock, isProductionEnvironmentMock } = vi.hoisted(() => ({
  getThemeTokensMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings', () => ({
  getSiteSettings: vi.fn(),
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

const enterRequestContextMock = vi.mocked(enterRequestContext);
const getRequestContextMock = vi.mocked(getRequestContext);
const getSiteSettingsMock = vi.mocked(getSiteSettings);

const THEME_TOKENS = {
  accentHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
};

const makeParams = (locale: TLocaleIsoCode = LOCALE_ISO_CODES.EN) =>
  Promise.resolve({ tenant: 'tenant-1', locale });

const renderLayout = (locale: TLocaleIsoCode = LOCALE_ISO_CODES.EN) =>
  LocaleLayout({
    children: <div>content</div>,
    params: makeParams(locale),
  }) as unknown as Promise<TAnyElement>;

const settingsFailure = () =>
  getSiteSettingsMock.mockResolvedValue({
    ok: false,
    error: 'boom',
  } as never);

describe('LocaleLayout', () => {
  beforeEach(() => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { name: 'Blog', logo: undefined } },
    } as never);
    getThemeTokensMock.mockResolvedValue(THEME_TOKENS);
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    isProductionEnvironmentMock.mockReturnValue(true);
  });

  describe('generateStaticParams', () => {
    it('returns params for every supported locale', () => {
      expect(generateStaticParams()).toEqual([{ locale: LOCALE_ISO_CODES.EN }]);
    });
  });

  describe('generateMetadata', () => {
    it('builds title from site settings and emits no description', async () => {
      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata).toEqual(
        expect.objectContaining({
          title: { default: 'Blog', template: '%s | Blog' },
        }),
      );
      expect(metadata).not.toHaveProperty('description');
    });

    it('falls back to metadataBase only when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      settingsFailure();

      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata).not.toHaveProperty('title');
      errorSpy.mockRestore();
    });

    it('omits robots restrictions in production (indexable)', async () => {
      isProductionEnvironmentMock.mockReturnValue(true);

      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata).not.toHaveProperty('robots');
    });

    it('adds noindex, nofollow robots metadata outside production', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);

      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('still applies noindex, nofollow outside production when site settings fail', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      isProductionEnvironmentMock.mockReturnValue(false);
      settingsFailure();

      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata.robots).toEqual({ index: false, follow: false });
      errorSpy.mockRestore();
    });

    it('enters the request context from its route params', async () => {
      const params = makeParams();

      await generateMetadata({ params });

      expect(enterRequestContextMock).toHaveBeenCalledWith(params);
    });

    it("sets metadataBase to the tenant's base URL", async () => {
      const metadata = await generateMetadata({ params: makeParams() });

      expect(metadata.metadataBase).toBe(DEFAULT_REQUEST_CONTEXT.metadataBase);
    });
  });

  it('declares the served language on the document', async () => {
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    const document = await renderLayout(LOCALE_ISO_CODES.NL);

    expect(document.props.lang).toBe(LOCALE_BCP47_TAGS.NL);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const [themeScope] = childrenOf(await renderLayout());

    expect(themeScope?.type).toBe(ThemeScope);
    expect(themeScope?.props.themeTokens).toBe(THEME_TOKENS);
  });

  it('forwards the entered tenant to the theme token loader', async () => {
    await renderLayout();

    expect(getThemeTokensMock).toHaveBeenCalledWith('tenant-1');
  });

  it('composes the providers around the header, page content and footer, with analytics beside them', async () => {
    const [themeScope] = childrenOf(await renderLayout());
    const [providers, analytics] = childrenOf(themeScope as TAnyElement);
    const [page] = childrenOf(providers as TAnyElement);
    const [header, , footer] = childrenOf(page as TAnyElement);

    expect(providers?.type).toBe(SiteProviders);
    expect(analytics?.type).toBe(SiteAnalytics);
    expect(header?.type).toBe(SiteHeader);
    expect(footer?.type).toBe(SiteFooter);
  });

  describe('when site settings fail to load', () => {
    it('calls the real Next.js notFound() instead of rendering a broken shell', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      settingsFailure();

      await expect(renderLayout()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      errorSpy.mockRestore();
    });

    it('preserves the site_settings.layout_fetch_failed log call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      settingsFailure();

      await expect(renderLayout()).rejects.toThrow();

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
      settingsFailure();

      await expect(renderLayout()).rejects.toThrow('NEXT_NOT_FOUND');

      expect(enterRequestContextMock.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(notFound).mock.invocationCallOrder[0]!,
      );
      errorSpy.mockRestore();
    });
  });
});
