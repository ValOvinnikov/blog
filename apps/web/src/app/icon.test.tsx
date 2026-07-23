import { BRAND_VARIANTS } from '@blog/config';

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

describe('icon', () => {
  beforeEach(() => {
    getSiteSettingsMock.mockReset();
  });

  it('renders the Console mark when brand.variant is Console', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { variant: BRAND_VARIANTS.CONSOLE } },
    });
    const { default: Icon } = await import('./icon');

    const response = await Icon();
    const svg = await response.text();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(svg).toContain('.layer-1 { fill: #006ac5; }');
  });

  it('renders the Indigo mark when brand.variant is Indigo', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: { brand: { variant: BRAND_VARIANTS.INDIGO } },
    });
    const { default: Icon } = await import('./icon');

    const response = await Icon();
    const svg = await response.text();

    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(svg).toContain('.layer-1 { fill: #3e36dd; }');
  });

  it('falls back to the Console mark and logs when site settings fail to load', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { default: Icon } = await import('./icon');

    const response = await Icon();
    const svg = await response.text();

    expect(svg).toContain('.layer-1 { fill: #006ac5; }');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('icon'),
    );
    consoleErrorSpy.mockRestore();
  });
});
