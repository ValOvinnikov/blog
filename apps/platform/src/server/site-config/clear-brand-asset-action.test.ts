import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { clearBrandAssetAction } from './clear-brand-asset-action';

const {
  getSiteConfigOrDefaultsMock,
  upsertSiteConfigMock,
  insertAuditEventMock,
  delMock,
} = vi.hoisted(() => ({
  getSiteConfigOrDefaultsMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/site-config-or-defaults', () => ({
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

vi.mock('@platform/utils/env/env');

Object.assign(env, { BLOB_READ_WRITE_TOKEN: 'test-token' });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

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
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
  });

  it('re-resolves the tenant from the session against the routed id before writing', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });

    await clearBrandAssetAction('tenant-1', 'favicon');

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
  });

  it('nulls the logo column and deletes the stored blob', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: undefined,
    });
    upsertSiteConfigMock.mockResolvedValue({});

    const result = await clearBrandAssetAction('tenant-1', 'logo');

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

  it('records one SETTINGS_UPDATED audit event naming the asset and operation', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await clearBrandAssetAction('tenant-1', 'favicon');

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

    const result = await clearBrandAssetAction('tenant-1', 'favicon');

    expect(result).toEqual({ ok: true });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports failure without throwing, and no audit event, when the write fails', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await clearBrandAssetAction('tenant-1', 'favicon');

    expect(result).toEqual({
      ok: false,
      error: "Couldn't remove the favicon — try again.",
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(clearBrandAssetAction('tenant-1', 'logo')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(clearBrandAssetAction('tenant-1', 'logo')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
