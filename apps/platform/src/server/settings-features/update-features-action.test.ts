import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import {
  updateFeaturesAction,
  type TUpdateFeaturesInput,
} from './update-features-action';

const {
  upsertSettingsFeaturesMock,
  revalidateSiteConfigMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  upsertSettingsFeaturesMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@platform/utils/logger/logger');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: { upsertSettingsFeatures: upsertSettingsFeaturesMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);
const loggerWarnMock = vi.mocked(logger.warn);

const FREE_TENANT = { id: 'tenant-1', plan: 'FREE' };
const GROWTH_TENANT = { id: 'tenant-2', plan: 'GROWTH' };

const VALID_INPUT: TUpdateFeaturesInput = {
  commentsEnabled: false,
  ratingsEnabled: false,
  bookmarksEnabled: false,
  newsletterEnabled: false,
  analyticsEnabled: false,
  consentBannerEnabled: true,
};

describe(updateFeaturesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: 'OWNER' },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    upsertSettingsFeaturesMock.mockReset();
    upsertSettingsFeaturesMock.mockResolvedValue({});
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
  });

  it('re-resolves the tenant from the session against the routed id before writing', async () => {
    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-1',
      VALID_INPUT,
    );
    expect(result).toEqual({ ok: true });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
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

  it('rejects enabling a GROWTH-only capability on a FREE tenant, and writes nothing', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });

    expect(result).toEqual({ ok: false });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('lets a FREE tenant save an entitled field despite a clamped out-of-plan one', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      bookmarksEnabled: false,
      analyticsEnabled: false,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1', {
      ...VALID_INPUT,
      bookmarksEnabled: false,
      analyticsEnabled: false,
    });
  });

  it('allows a GROWTH tenant to enable the same capability', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: 'OWNER' },
    });

    const result = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-2', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });
  });

  it('writes Comments, Ratings and Newsletter off even when the payload switches them on', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: 'OWNER' },
    });

    const result = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      commentsEnabled: true,
      ratingsEnabled: true,
      newsletterEnabled: true,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-2',
      VALID_INPUT,
    );
  });

  it('does not reject a FREE tenant for switching on a "Coming soon" capability outside its plan', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      newsletterEnabled: true,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-1',
      VALID_INPUT,
    );
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    upsertSettingsFeaturesMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: false });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
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
