import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';

import { clearBrandAssetAction } from './clear-brand-asset-action';

const {
  requireTenantMembershipMock,
  authMock,
  getSiteConfigOrDefaultsMock,
  upsertSiteConfigMock,
  insertAuditEventMock,
  delMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  getSiteConfigOrDefaultsMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
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
    authMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
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

  it('records exactly one SETTINGS_UPDATED audit event identifying the asset and operation', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await clearBrandAssetAction('acme', 'favicon');

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: { asset: 'favicon', operation: 'clear' },
    });
  });

  it('is a no-op success when the field is already empty, and records no audit event', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });

    const result = await clearBrandAssetAction('acme', 'favicon');

    expect(result).toEqual({ ok: true });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports failure instead of throwing when the write itself fails, and records no audit event', async () => {
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
    expect(insertAuditEventMock).not.toHaveBeenCalled();
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
