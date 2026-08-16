import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import RootLayout from './layout';

const { listTenantsMock, getSiteConfigMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

const { envMock } = vi.hoisted(() => ({
  envMock: { WEB_ANALYTICS_ENABLED: undefined as string | undefined },
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
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
    listTenantsMock.mockResolvedValue([TENANT]);
    getSiteConfigMock.mockResolvedValue(CONSOLE_SITE_CONFIG_ROW);
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

  it('falls back to the Console preset tokens when the site config fetch fails', async () => {
    listTenantsMock.mockRejectedValue(new Error('boom'));
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
      expect.stringContaining('site config'),
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
});
