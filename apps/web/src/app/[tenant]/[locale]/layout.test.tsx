import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  RADIUS_SCALE,
} from '@blog/config';
import { SiteProviders } from '@web/components/features/layout/site-providers';
import { PreviewBanner } from '@web/components/features/preview/preview-banner';
import { SiteAnalytics } from '@web/components/shared/site-analytics';
import { SiteFooter } from '@web/components/shared/site-footer';
import { SiteHeader } from '@web/components/shared/site-header';
import { ThemeScope } from '@web/components/shared/theme-scope';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { mockRouteParams } from '@web/testing/app/route-params';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
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

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

vi.mock('@web/utils/get-theme-tokens', () => ({
  getThemeTokens: getThemeTokensMock,
}));

const enterRequestContextMock = vi.mocked(enterRequestContext);
const getRequestContextMock = vi.mocked(getRequestContext);

const MOCK_THEME_TOKENS = {
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

const NOINDEX_ROBOTS = { index: false, follow: false };

const renderLayout = () =>
  LocaleLayout({
    children: <div>content</div>,
    params: mockRouteParams(),
  }) as unknown as Promise<TAnyElement>;

const renderComposition = async () => {
  const [themeScope] = childrenOf(await renderLayout());
  const [providers, analytics] = childrenOf(themeScope as TAnyElement);
  const [page] = childrenOf(providers as TAnyElement);
  return {
    providers,
    analytics,
    pageChildren: childrenOf(page as TAnyElement),
  };
};

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
  it('builds the title from the brand name and stays indexable in production', async () => {
    const metadata = await generateMetadata({ params: mockRouteParams() });

    expect(metadata).toEqual({
      metadataBase: MOCK_REQUEST_CONTEXT.metadataBase,
      title: {
        default: MOCK_TENANT_NAME,
        template: `%s | ${MOCK_TENANT_NAME}`,
      },
    });
  });

  it("reads the brand name for the request context's tenant", async () => {
    await generateMetadata({ params: mockRouteParams() });

    expect(vi.mocked(getBrandName)).toHaveBeenCalledWith(MOCK_REQUEST_CONTEXT);
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

  describe('without a brand name', () => {
    beforeEach(() => {
      vi.mocked(getBrandName).mockResolvedValueOnce(undefined);
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
    const { providers, analytics, pageChildren } = await renderComposition();
    const [, header, , footer] = pageChildren;

    expect(providers?.type).toBe(SiteProviders);
    expect(analytics?.type).toBe(SiteAnalytics);
    expect(header?.type).toBe(SiteHeader);
    expect(footer?.type).toBe(SiteFooter);
  });

  it('shows the preview banner above the header in a draft preview', async () => {
    getRequestContextMock.mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      isDraftPreview: true,
    });

    const { pageChildren } = await renderComposition();
    const [banner, header] = pageChildren;

    expect(banner?.type).toBe(PreviewBanner);
    expect(header?.type).toBe(SiteHeader);
  });

  it('leaves the preview banner out for a visitor', async () => {
    const { pageChildren } = await renderComposition();
    const types = pageChildren.map((child) => child?.type);

    expect(types).not.toContain(PreviewBanner);
  });

  it('leaves out the site header and footer on an operator-suspended site', async () => {
    getRequestContextMock.mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      isOperatorSuspended: true,
    });

    const { pageChildren } = await renderComposition();
    const types = pageChildren.map((child) => child?.type);

    expect(types).not.toContain(SiteHeader);
    expect(types).not.toContain(SiteFooter);
  });
});
