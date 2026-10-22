import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import {
  updateFeaturesAction,
  type TUpdateFeaturesInput,
} from './update-features-action';

const {
  upsertSettingsFeaturesMock,
  insertAuditEventMock,
  getSettingsFeaturesOrDefaultsMock,
} = vi.hoisted(() => ({
  upsertSettingsFeaturesMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  getSettingsFeaturesOrDefaultsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock(
  '@platform/server/settings-features/settings-features-or-defaults',
  () => ({ getSettingsFeaturesOrDefaults: getSettingsFeaturesOrDefaultsMock }),
);

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

const SAVED_AT = '2026-10-01T00:00:00Z';
const DB_UNAVAILABLE = 'db unavailable';

const FREE_TENANT = { id: 'tenant-1', plan: TENANT_PLAN.FREE };
const GROWTH_TENANT = { id: 'tenant-2', plan: TENANT_PLAN.GROWTH };

const VALID_INPUT: TUpdateFeaturesInput = {
  commentsEnabled: false,
  ratingsEnabled: false,
  bookmarksEnabled: false,
  newsletterEnabled: false,
  analyticsEnabled: false,
  consentBannerEnabled: true,
  contactFormEnabled: false,
};

const ALL_OFF: TUpdateFeaturesInput = {
  ...VALID_INPUT,
  consentBannerEnabled: false,
};

const revalidateSiteConfigMock = vi.mocked(revalidateSiteConfig);

describe(updateFeaturesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    requireTenantMembershipMock.mockResolvedValue({
      tenant: FREE_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    upsertSettingsFeaturesMock.mockReset();
    upsertSettingsFeaturesMock.mockResolvedValue({});
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getSettingsFeaturesOrDefaultsMock.mockReset();
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: ALL_OFF,
      savedAt: undefined,
    });
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
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('rejects enabling a GROWTH-only capability on a FREE tenant, and writes nothing', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
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

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1', {
      ...VALID_INPUT,
      bookmarksEnabled: false,
      analyticsEnabled: false,
    });
  });

  it('keeps the stored out-of-plan toggles when a downgraded FREE tenant saves', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: {
        ...ALL_OFF,
        bookmarksEnabled: true,
        analyticsEnabled: true,
        contactFormEnabled: true,
      },
      savedAt: new Date(SAVED_AT),
    });

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1', {
      ...VALID_INPUT,
      bookmarksEnabled: true,
      analyticsEnabled: true,
      contactFormEnabled: true,
    });
  });

  it('writes a stored "Coming soon" toggle off for a downgraded FREE tenant', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: { ...ALL_OFF, commentsEnabled: true, newsletterEnabled: true },
      savedAt: new Date(SAVED_AT),
    });

    await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-1',
      VALID_INPUT,
    );
  });

  it('refuses a downgraded FREE tenant switching an out-of-plan toggle on, and writes nothing', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: { ...ALL_OFF, bookmarksEnabled: true },
      savedAt: new Date(SAVED_AT),
    });

    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      bookmarksEnabled: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it("writes a GROWTH tenant's submitted toggles over the stored ones", async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: { ...ALL_OFF, bookmarksEnabled: true, analyticsEnabled: true },
      savedAt: new Date(SAVED_AT),
    });

    await updateFeaturesAction('tenant-2', VALID_INPUT);

    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-2',
      VALID_INPUT,
    );
  });

  it('reports failure instead of throwing when reading the stored toggles fails', async () => {
    getSettingsFeaturesOrDefaultsMock.mockRejectedValue(
      new Error(DB_UNAVAILABLE),
    );

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('rejects switching the contact form on for a FREE tenant', async () => {
    const result = await updateFeaturesAction('tenant-1', {
      ...VALID_INPUT,
      contactFormEnabled: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('lets a GROWTH tenant switch the contact form on and back off', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });

    const on = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      contactFormEnabled: true,
    });
    const off = await updateFeaturesAction('tenant-2', VALID_INPUT);

    expect(on).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(off).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenNthCalledWith(1, 'tenant-2', {
      ...VALID_INPUT,
      contactFormEnabled: true,
    });
    expect(upsertSettingsFeaturesMock).toHaveBeenNthCalledWith(
      2,
      'tenant-2',
      VALID_INPUT,
    );
  });

  it('allows a GROWTH tenant to enable the same capability', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });

    const result = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith('tenant-2', {
      ...VALID_INPUT,
      analyticsEnabled: true,
    });
  });

  it('writes Comments, Ratings and Newsletter off even when the payload switches them on', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });

    const result = await updateFeaturesAction('tenant-2', {
      ...VALID_INPUT,
      commentsEnabled: true,
      ratingsEnabled: true,
      newsletterEnabled: true,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      'tenant-1',
      VALID_INPUT,
    );
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    upsertSettingsFeaturesMock.mockRejectedValue(new Error(DB_UNAVAILABLE));

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
    await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: 'tenant-1',
      details: VALID_INPUT,
    });
  });

  it('still succeeds when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateFeaturesAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
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
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(updateFeaturesAction('tenant-1', VALID_INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(updateFeaturesAction('tenant-1', VALID_INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
