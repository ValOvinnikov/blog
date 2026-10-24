import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import {
  MEMBERSHIP_ROLE,
  PLAN_REGISTRY,
  TENANT_PLAN,
} from '@blog/db/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { SETTINGS_FEATURES_LOG } from '@platform/constants/settings-features';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_EMAIL,
} from '@platform/testing/admins/operator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { CAPABILITY_TOGGLES } from '@platform/utils/settings-features-fields/settings-features-fields';
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

const FREE_TENANT = { id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE };
const GROWTH_TENANT = { id: 'tenant-2', plan: TENANT_PLAN.GROWTH };
const PLAN_GATED_FIELDS = CAPABILITY_TOGGLES.filter(
  ({ capability, isComingSoon }) =>
    !isComingSoon &&
    PLAN_REGISTRY[TENANT_PLAN.GROWTH].includes(capability) &&
    !PLAN_REGISTRY[TENANT_PLAN.FREE].includes(capability),
).map(({ field }) => field);
const PLAN_GATED_ON = Object.fromEntries(
  PLAN_GATED_FIELDS.map((field) => [field, true]),
);

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
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
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
    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
    await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a payload with a non-boolean field without ever calling the tenant gate', async () => {
    const result = await updateFeaturesAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      commentsEnabled: 'yes' as unknown as boolean,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it.each(PLAN_GATED_FIELDS)(
    'refuses a FREE tenant switching %s on, and writes nothing',
    async (field) => {
      const result = await updateFeaturesAction(MOCK_TENANT_ID, {
        ...VALID_INPUT,
        [field]: true,
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
      });
      expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it.each(PLAN_GATED_FIELDS)(
    'lets a GROWTH tenant switch %s on',
    async (field) => {
      requireTenantMembershipMock.mockResolvedValue({
        tenant: GROWTH_TENANT,
        membership: { role: MEMBERSHIP_ROLE.OWNER },
      });

      const result = await updateFeaturesAction(GROWTH_TENANT.id, {
        ...VALID_INPUT,
        [field]: true,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        GROWTH_TENANT.id,
        { ...VALID_INPUT, [field]: true },
      );
    },
  );

  it('lets a FREE tenant save an entitled field despite a clamped out-of-plan one', async () => {
    const result = await updateFeaturesAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      bookmarksEnabled: false,
      analyticsEnabled: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
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

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
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

    await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
  });

  it('refuses a downgraded FREE tenant switching an out-of-plan toggle on, and writes nothing', async () => {
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: { ...ALL_OFF, bookmarksEnabled: true },
      savedAt: new Date(SAVED_AT),
    });

    const result = await updateFeaturesAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      bookmarksEnabled: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('lets a GROWTH tenant switch every plan-gated toggle back off', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: GROWTH_TENANT,
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: { ...ALL_OFF, ...PLAN_GATED_ON },
      savedAt: new Date(SAVED_AT),
    });

    await updateFeaturesAction(GROWTH_TENANT.id, VALID_INPUT);

    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      GROWTH_TENANT.id,
      VALID_INPUT,
    );
  });

  it('reports failure instead of throwing when reading the stored toggles fails', async () => {
    getSettingsFeaturesOrDefaultsMock.mockRejectedValue(
      new Error(DB_UNAVAILABLE),
    );

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
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
    const result = await updateFeaturesAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      newsletterEnabled: true,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
  });

  it('reports failure instead of throwing when the write itself fails', async () => {
    upsertSettingsFeaturesMock.mockRejectedValue(new Error(DB_UNAVAILABLE));

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
    await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: MOCK_TENANT_ID,
      details: VALID_INPUT,
    });
  });

  it('still succeeds when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      SETTINGS_FEATURES_LOG.UPDATE_AUDIT_FAILED,
      expect.objectContaining({
        targetId: MOCK_TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(
      updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
