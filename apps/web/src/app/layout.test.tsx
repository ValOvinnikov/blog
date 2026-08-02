import { BRAND_VARIANTS } from '@blog/config';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import RootLayout from './layout';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

const { envMock } = vi.hoisted(() => ({
  envMock: { VERCEL_ANALYTICS_ENABLED: undefined as string | undefined },
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: envMock,
}));

describe(`<${RootLayout.name}/>`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.VERCEL_ANALYTICS_ENABLED = undefined;
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { variant: BRAND_VARIANTS.CONSOLE } },
    });
  });

  it('mounts children in the body', async () => {
    const children = <div>content</div>;
    const html = await RootLayout({ children });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(bodyChildren).toContainEqual(children);
  });

  it('omits Analytics and SpeedInsights when VERCEL_ANALYTICS_ENABLED is unset', async () => {
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

  it('mounts Analytics and SpeedInsights when VERCEL_ANALYTICS_ENABLED is "true"', async () => {
    envMock.VERCEL_ANALYTICS_ENABLED = 'true';
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
