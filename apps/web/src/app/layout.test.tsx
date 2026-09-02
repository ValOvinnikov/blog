import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import RootLayout from './layout';

const {
  getRequestTenantIdMock,
  listTenantsByIdsMock,
  getSiteConfigMock,
  getSettingsFeaturesMock,
} = vi.hoisted(() => ({
  getRequestTenantIdMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  getSettingsFeaturesMock: vi.fn(),
}));

const { envMock } = vi.hoisted(() => ({
  envMock: { WEB_ANALYTICS_ENABLED: undefined as string | undefined },
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
    },
    siteConfig: { getSiteConfig: getSiteConfigMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
  },
  // Mirrors `@blog/db`'s real `PLAN_REGISTRY` (GROWTH entitles every
  // capability, FREE excludes NEWSLETTER/ANALYTICS) — hardcoded rather than
  // imported, since `vi.mock` replaces the whole module.
  PLAN_REGISTRY: {
    FREE: ['COMMENTS', 'RATINGS', 'BOOKMARKS'],
    GROWTH: ['COMMENTS', 'RATINGS', 'BOOKMARKS', 'NEWSLETTER', 'ANALYTICS'],
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock('@web/utils/env/env', () => ({
  env: envMock,
}));

const TENANT = { id: 'tenant-1' };

const CONSOLE_SITE_CONFIG_ROW = {
  preset: 'CONSOLE',
  accentHue: 250,
  logoHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
  voiceOverrides: {},
};

describe(`<${RootLayout.name}/>`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.WEB_ANALYTICS_ENABLED = undefined;
    getRequestTenantIdMock.mockResolvedValue(TENANT.id);
    getSiteConfigMock.mockResolvedValue(CONSOLE_SITE_CONFIG_ROW);
    listTenantsByIdsMock.mockResolvedValue([{ ...TENANT, plan: 'GROWTH' }]);
    getSettingsFeaturesMock.mockResolvedValue({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: true,
    });
  });

  it('mounts children in the body', async () => {
    const children = <div>content</div>;
    const html = await RootLayout({ children });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(bodyChildren).toContainEqual(children);
  });

  it('injects the resolved theme tokens as a <style> block', async () => {
    const html = await RootLayout({ children: <div>content</div> });

    const [head] = html.props.children;
    const headChildren = [head.props.children].flat();
    const style = headChildren.find(
      (child: React.ReactElement) => child?.type === 'style',
    );

    expect(style.props.dangerouslySetInnerHTML.__html).toContain(
      '--brand-primary: oklch(0.53 0.17 250);',
    );
  });

  it('preconnects to the Sanity image CDN without crossorigin', async () => {
    const html = await RootLayout({ children: <div>content</div> });

    const [head] = html.props.children;
    const headChildren = [head.props.children].flat();
    const preconnect = headChildren.find(
      (child: React.ReactElement<{ rel?: string }>) =>
        child?.type === 'link' && child.props.rel === 'preconnect',
    );

    expect(preconnect.props.href).toBe('https://cdn.sanity.io');
    expect(preconnect.props.crossOrigin).toBeUndefined();
  });

  it('falls back to the Console preset tokens when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error('boom'));
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const html = await RootLayout({ children: <div>content</div> });

    const [head] = html.props.children;
    const headChildren = [head.props.children].flat();
    const style = headChildren.find(
      (child: React.ReactElement) => child?.type === 'style',
    );

    expect(style.props.dangerouslySetInnerHTML.__html).toContain(
      '--brand-primary: oklch(0.53 0.17 250);',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('theme_tokens.site_config_fetch_failed'),
    );
    consoleErrorSpy.mockRestore();
  });

  it('omits Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is unset', async () => {
    const html = await RootLayout({ children: <div>content</div> });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === Analytics,
      ),
    ).toBe(false);
    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('mounts Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is "true"', async () => {
    envMock.WEB_ANALYTICS_ENABLED = 'true';
    const html = await RootLayout({ children: <div>content</div> });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === Analytics,
      ),
    ).toBe(true);
    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(true);
  });

  it('omits Analytics and SpeedInsights when WEB_ANALYTICS_ENABLED is "true" but the ANALYTICS capability is not entitled/enabled', async () => {
    envMock.WEB_ANALYTICS_ENABLED = 'true';
    listTenantsByIdsMock.mockResolvedValue([{ ...TENANT, plan: 'FREE' }]);

    const html = await RootLayout({ children: <div>content</div> });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === Analytics,
      ),
    ).toBe(false);
    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });

  it('omits Analytics and SpeedInsights when the plan entitles ANALYTICS but the tenant has toggled it off', async () => {
    envMock.WEB_ANALYTICS_ENABLED = 'true';
    // beforeEach already sets plan: 'GROWTH' (entitled) — only the toggle
    // changes here, proving the tenant's own choice can block a
    // plan-entitled capability (the mirror of the FREE-plan case above,
    // where the plan ceiling blocks a tenant-enabled toggle).
    getSettingsFeaturesMock.mockResolvedValue({
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
    });

    const html = await RootLayout({ children: <div>content</div> });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === Analytics,
      ),
    ).toBe(false);
    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(false);
  });
});
