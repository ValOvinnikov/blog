import { BRAND_VARIANTS } from '@blog/config';
import { SpeedInsights } from '@vercel/speed-insights/next';

import RootLayout from './layout';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

describe(`<${RootLayout.name}/>`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { variant: BRAND_VARIANTS.CONSOLE } },
    });
  });

  it('mounts SpeedInsights alongside children in the body', async () => {
    const children = <div>content</div>;
    const html = await RootLayout({ children });

    const [, body] = html.props.children;
    const bodyChildren = [body.props.children].flat();

    expect(bodyChildren).toContainEqual(children);
    expect(
      bodyChildren.some(
        (child: React.ReactElement) => child?.type === SpeedInsights,
      ),
    ).toBe(true);
  });
});
