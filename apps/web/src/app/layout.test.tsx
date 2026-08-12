import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import RootLayout from './layout';

const { getThemeMock } = vi.hoisted(() => ({
  getThemeMock: vi.fn(),
}));

const { envMock } = vi.hoisted(() => ({
  envMock: { VERCEL_ANALYTICS_ENABLED: undefined as string | undefined },
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      themeSettings: { v1: { getTheme: getThemeMock } },
    },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: envMock,
}));

const CONSOLE_THEME_TOKENS = {
  accentHue: 250,
  logoHue: 250,
  headingFont: 'SPACE_GROTESK',
  bodyFont: 'NEWSREADER',
  radiusScale: 'MD',
  density: 'DEFAULT',
  chromeOn: true,
};

describe(`<${RootLayout.name}/>`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.VERCEL_ANALYTICS_ENABLED = undefined;
    getThemeMock.mockResolvedValue({ ok: true, data: CONSOLE_THEME_TOKENS });
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

  it('falls back to the Console preset tokens when the theme fetch fails', async () => {
    getThemeMock.mockResolvedValue({ ok: false, error: 'boom' });
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
      expect.stringContaining('theme settings'),
    );
    consoleErrorSpy.mockRestore();
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
