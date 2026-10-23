import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { MOCK_BLOB_TOKEN } from '@platform/testing/blob/fixtures';
import {
  MOCK_LOGO_URL,
  MOCK_FAVICON_URL,
  MOCK_THEME_FIELDS,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
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

Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(clearBrandAssetAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: MOCK_TENANT_ID },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
    upsertSiteConfigMock.mockResolvedValue({});
  });

  it('re-resolves the tenant from the session against the routed id before writing', async () => {
    await clearBrandAssetAction(MOCK_TENANT_ID, 'favicon');

    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('nulls the logo column and deletes the stored blob', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: MOCK_LOGO_URL,
      faviconAssetUrl: undefined,
    });

    const result = await clearBrandAssetAction(MOCK_TENANT_ID, 'logo');

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: null,
    });
    expect(delMock).toHaveBeenCalledWith(MOCK_LOGO_URL, {
      token: MOCK_BLOB_TOKEN,
    });
  });

  it('records one SETTINGS_UPDATED audit event naming the asset and operation', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: MOCK_FAVICON_URL,
    });

    await clearBrandAssetAction(MOCK_TENANT_ID, 'favicon');

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      actorEmail: MOCK_OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { asset: 'favicon', operation: 'clear' },
    });
  });

  it('is a no-op success when the field is already empty, and records no audit event', async () => {
    const result = await clearBrandAssetAction(MOCK_TENANT_ID, 'favicon');

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports failure without throwing, and no audit event, when the write fails', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: MOCK_FAVICON_URL,
    });
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await clearBrandAssetAction(MOCK_TENANT_ID, 'favicon');

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(clearBrandAssetAction(MOCK_TENANT_ID, 'logo')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(clearBrandAssetAction(MOCK_TENANT_ID, 'logo')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
