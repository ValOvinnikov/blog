import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import {
  updateFeaturesAction,
  type TUpdateFeaturesInput,
} from './update-features-action';

const {
  requireTenantMembershipMock,
  authMock,
  upsertSettingsFeaturesMock,
  revalidateSiteConfigMock,
  insertAuditEventMock,
  loggerErrorMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  upsertSettingsFeaturesMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@platform/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock, warn: loggerWarnMock },
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: { upsertSettingsFeatures: upsertSettingsFeaturesMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const FREE_TENANT = { id: 'tenant-1', plan: 'FREE' };
const GROWTH_TENANT = { id: 'tenant-2', plan: 'GROWTH' };

const VALID_INPUT: TUpdateFeaturesInput = {
  commentsEnabled: true,
  ratingsEnabled: true,
  bookmarksEnabled: true,
  newsletterEnabled: false,
  analyticsEnabled: false,
};

describe(updateFeaturesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    upsertSettingsFeaturesMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
  });

  it('re-resolves the tenant from the session against the routed tenant id before writing anything', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-1',
      VALID_INPUT,
    );
    expect(result).toEqual({ ok: true });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});

    await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a payload with a non-boolean field without ever calling the tenant gate', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      commentsEnabled: 'yes' as unknown as boolean,
    });

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it("rejects an attempt to enable a GROWTH-only capability on a FREE tenant, bypassing the UI's disabled control, and writes nothing", async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });

    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      newsletterEnabled: true,
    });

    expect(result).toEqual({ ok: false });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('is not tripped by a stale-then-clamped out-of-plan field: a FREE tenant saving only an entitled-field change succeeds', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});

    // Simulates the post-downgrade payload: `newsletterEnabled` was a
    // stale `true` from when the tenant was GROWTH, but the client clamps
    // it to `false` before this action ever sees it (see
    // `clampToEntitlement`) — only `commentsEnabled` was actually changed.
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      commentsEnabled: false,
      newsletterEnabled: false,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1', {
      ...VALID_INPUT,
      commentsEnabled: false,
      newsletterEnabled: false,
    });
  });

  it('allows a GROWTH tenant to enable the same capability', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});

    const result = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      newsletterEnabled: true,
      analyticsEnabled: true,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-2', {
      ...VALID_INPUT,
      newsletterEnabled: true,
      analyticsEnabled: true,
    });
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: false });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});

    await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: 'tenant-1',
      details: VALID_INPUT,
    });
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    upsertSettingsFeaturesMock.mockResolvedValue({});
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: true });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'settings_features.update_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(updateFeaturesAction('tenant-1', VALID_INPUT)).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(updateFeaturesAction('tenant-1', VALID_INPUT)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
