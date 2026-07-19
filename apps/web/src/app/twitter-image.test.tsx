import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

const { buildDefaultSocialImageMock } = vi.hoisted(() => ({
  buildDefaultSocialImageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: {
      siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } },
    },
  },
}));

vi.mock('@web/metadata/default-social-image/default-social-image', () => ({
  buildDefaultSocialImage: buildDefaultSocialImageMock,
  contentType: 'image/png',
  size: { width: 1200, height: 630 },
}));

describe('twitter-image', () => {
  beforeEach(() => {
    getSiteSettingsMock.mockReset();
    buildDefaultSocialImageMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('renders the brand name and tagline from site settings', async () => {
    getSiteSettingsMock.mockResolvedValue({
      ok: true,
      data: {
        brand: { name: 'Test Brand', prefix: 'test', suffix: 'brand' },
        tagline: 'Building things',
      },
    });
    const { default: Image } = await import('./twitter-image');

    await Image();

    expect(buildDefaultSocialImageMock).toHaveBeenCalledWith({
      brandName: 'Test Brand',
      tagline: 'Building things',
    });
  });

  it('falls back to the brand-mark-only image when site settings fail to load', async () => {
    getSiteSettingsMock.mockResolvedValue({ ok: false, error: 'boom' });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { default: Image } = await import('./twitter-image');

    await Image();

    expect(buildDefaultSocialImageMock).toHaveBeenCalledWith({});
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
