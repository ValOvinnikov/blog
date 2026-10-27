import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  RADIUS_SCALE,
} from '@blog/config';
import { errorResult } from '@blog/utils';
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
import { mockRouteParams } from '@web/testing/app/route-params';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import LocaleLayout, { generateMetadata, generateStaticParams } from './layout';

type TAnyElement = ReactElement<Record<string, unknown>>;

const childrenOf = (node: TAnyElement): TAnyElement[] => {
  const { children } = node.props as { children?: TAnyElement | TAnyElement[] };
  return [children ?? []].flat();
};

const { getThemeTokensMock, isProductionEnvironmentMock } = vi.hoisted(() => ({
  getThemeTokensMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

const enterRequestContextMock = vi.mocked(enterRequestContext);
const getRequestContextMock = vi.mocked(getRequestContext);
const getSiteSettingsMock = vi.mocked(getSiteSettings);

const MOCK_THEME_TOKENS = {
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

const NOINDEX_ROBOTS = { index: false, follow: false };

const SETTINGS_FAILURE_SUITE = 'when site settings fail to load';

const renderLayout = () =>
  LocaleLayout({
    children: <div>content</div>,
    params: mockRouteParams(),
  }) as unknown as Promise<TAnyElement>;

const settingsFailure = () =>
  getSiteSettingsMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

beforeEach(() => {
  getThemeTokensMock.mockResolvedValue(MOCK_THEME_TOKENS);
  isProductionEnvironmentMock.mockReturnValue(true);
});

describe(generateStaticParams, () => {
  it('returns params for every supported locale', () => {
    expect(generateStaticParams()).toEqual([{ locale: LOCALE_ISO_CODES.EN }]);
  });
});

describe(generateMetadata, () => {
  it('builds the title from site settings and stays indexable in production', async () => {
    const metadata = await generateMetadata({ params: mockRouteParams() });

    expect(metadata).toEqual({
      metadataBase: MOCK_REQUEST_CONTEXT.metadataBase,
      title: {
        default: MOCK_SITE_SETTINGS.brand.name,
        template: `%s | ${MOCK_SITE_SETTINGS.brand.name}`,
      },
    });
  });

  it('adds noindex, nofollow robots metadata outside production', async () => {
    isProductionEnvironmentMock.mockReturnValue(false);

    const { robots } = await generateMetadata({ params: mockRouteParams() });

    expect(robots).toEqual(NOINDEX_ROBOTS);
  });

  it('enters the request context from its route params', async () => {
    const params = mockRouteParams();

    await generateMetadata({ params });

    expect(enterRequestContextMock).toHaveBeenCalledWith(params);
  });

  describe(SETTINGS_FAILURE_SUITE, () => {
    beforeEach(() => {
      settingsFailure();
    });

    it('falls back to metadataBase only', async () => {
      const metadata = await generateMetadata({ params: mockRouteParams() });

      expect(metadata).toEqual({
        metadataBase: MOCK_REQUEST_CONTEXT.metadataBase,
      });
    });

    it('still applies noindex, nofollow outside production', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);

      const { robots } = await generateMetadata({ params: mockRouteParams() });

      expect(robots).toEqual(NOINDEX_ROBOTS);
    });
  });
});

describe(`<${LocaleLayout.name}/>`, () => {
  it('declares the served language on the document', async () => {
    getRequestContextMock.mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });

    const document = await renderLayout();

    expect(document.props.lang).toBe(LOCALE_BCP47_TAGS.NL);
  });

  it('passes the resolved theme tokens through to ThemeScope', async () => {
    const [themeScope] = childrenOf(await renderLayout());

    expect(themeScope?.type).toBe(ThemeScope);
    expect(themeScope?.props.themeTokens).toBe(MOCK_THEME_TOKENS);
  });

  it('forwards the entered tenant to the theme token loader', async () => {
    await renderLayout();

    expect(getThemeTokensMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('composes providers around header, content and footer, with analytics', async () => {
    const [themeScope] = childrenOf(await renderLayout());
    const [providers, analytics] = childrenOf(themeScope as TAnyElement);
    const [page] = childrenOf(providers as TAnyElement);
    const [header, , footer] = childrenOf(page as TAnyElement);

    expect(providers?.type).toBe(SiteProviders);
    expect(analytics?.type).toBe(SiteAnalytics);
    expect(header?.type).toBe(SiteHeader);
    expect(footer?.type).toBe(SiteFooter);
  });

  describe(SETTINGS_FAILURE_SUITE, () => {
    beforeEach(() => {
      settingsFailure();
    });

    it('calls notFound() instead of rendering a broken shell', async () => {
      await expect(renderLayout()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    });

    it('logs the layout fetch failure', async () => {
      await expect(renderLayout()).rejects.toThrow();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'site_settings.layout_fetch_failed',
        { error: MOCK_ERROR },
      );
    });

    it('enters the request context ahead of the notFound() it throws', async () => {
      await expect(renderLayout()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(enterRequestContextMock.mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(notFound).mock.invocationCallOrder[0]!,
      );
    });
  });
});
