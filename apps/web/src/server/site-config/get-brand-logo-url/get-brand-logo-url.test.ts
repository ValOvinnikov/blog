import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';

import { getBrandLogoUrl } from './get-brand-logo-url';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));
vi.mock('@web/utils/logger/logger');

const getSiteConfigMock = vi.mocked(getSiteConfig);

describe(getBrandLogoUrl, () => {
  it("returns the tenant's Look logo", async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { logoAssetUrl: 'https://blob.example.com/logo.png' },
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    await expect(getBrandLogoUrl('tenant-a')).resolves.toBe(
      'https://blob.example.com/logo.png',
    );
  });

  it('returns no logo when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(getBrandLogoUrl('tenant-a')).resolves.toBeUndefined();
  });

  it('returns no logo when the site config read fails', async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: false,
      error: new Error('down'),
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    await expect(getBrandLogoUrl('tenant-a')).resolves.toBeUndefined();
  });
});
