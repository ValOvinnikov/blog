import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';

import { clearBrandAssetAction } from './clear-brand-asset-action';

const {
  requireTenantMembershipMock,
  getSiteConfigOrDefaultsMock,
  upsertSiteConfigMock,
  delMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  getSiteConfigOrDefaultsMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@admin/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { upsertSiteConfig: upsertSiteConfigMock } },
}));

vi.mock('@vercel/blob', () => ({
  del: delMock,
}));

vi.mock('@admin/utils/env/env', () => ({
  env: { BLOB_READ_WRITE_TOKEN: 'test-token' },
}));

const THEME_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

describe(clearBrandAssetAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    upsertSiteConfigMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
  });

  it('re-resolves the tenant from the session against the routed slug before writing anything', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });

    await clearBrandAssetAction('acme', 'favicon');

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('acme');
  });

  it('nulls the logo column and deletes the stored blob', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: undefined,
    });
    upsertSiteConfigMock.mockResolvedValue({});

    const result = await clearBrandAssetAction('acme', 'logo');

    expect(result).toEqual({ ok: true });
    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', {
      ...THEME_FIELDS,
      logoAssetUrl: null,
    });
    expect(delMock).toHaveBeenCalledWith(
      'https://example.blob.vercel-storage.com/logo.png',
      { token: 'test-token' },
    );
  });

  it('is a no-op success when the field is already empty', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });

    const result = await clearBrandAssetAction('acme', 'favicon');

    expect(result).toEqual({ ok: true });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await clearBrandAssetAction('acme', 'favicon');

    expect(result).toEqual({
      ok: false,
      error: "Couldn't remove the favicon — try again.",
    });
  });

  it('propagates the unauthenticated/unauthorized redirect the tenant gate throws', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(clearBrandAssetAction('acme', 'logo')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
