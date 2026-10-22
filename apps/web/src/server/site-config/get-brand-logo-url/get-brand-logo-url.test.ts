import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';

import { getBrandLogoUrl } from './get-brand-logo-url';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

const LOGO_URL = 'https://blob.example.com/logo.png';

const getSiteConfigMock = vi.mocked(getSiteConfig);

describe(getBrandLogoUrl, () => {
  it("returns the tenant's Look logo", async () => {
    getSiteConfigMock.mockResolvedValue({
      ok: true,
      data: { logoAssetUrl: LOGO_URL },
    } as Awaited<ReturnType<typeof getSiteConfig>>);

    await expect(getBrandLogoUrl('tenant-a')).resolves.toBe(LOGO_URL);
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
