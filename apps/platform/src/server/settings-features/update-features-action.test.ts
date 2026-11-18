import { faker } from '@faker-js/faker';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import {
  FEATURES_FIELD_ERROR,
  SETTINGS_FEATURES_LOG,
} from '@platform/constants/settings-features';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  mockEditorMembershipContext,
  mockMembership,
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { CAPABILITY_TOGGLES } from '@platform/utils/settings-features-fields/settings-features-fields';
import {
  type TMaybeNull,
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { PLAN_REGISTRY } from '@shinefold/db/constants';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import type { Session } from 'next-auth';

import {
  updateFeaturesAction,
  type TUpdateFeaturesInput,
} from './update-features-action';

faker.seed(5998);

const {
  upsertSettingsFeaturesMock,
  insertAuditEventMock,
  getSettingsFeaturesOrDefaultsMock,
  getStoredTenantAnalyticsMock,
} = vi.hoisted(() => ({
  upsertSettingsFeaturesMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  getSettingsFeaturesOrDefaultsMock: vi.fn(),
  getStoredTenantAnalyticsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock(
  '@platform/server/settings-features/settings-features-or-defaults',
  () => ({ getSettingsFeaturesOrDefaults: getSettingsFeaturesOrDefaultsMock }),
);

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: { upsertSettingsFeatures: upsertSettingsFeaturesMock },
    tenantAnalytics: { getStoredTenantAnalytics: getStoredTenantAnalyticsMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_SAVED_AT = faker.date.past({ refDate: '2026-10-01' });
const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);

const PLAN_GATED_FIELDS = CAPABILITY_TOGGLES.filter(
  ({ capability, isComingSoon }) =>
    !isComingSoon &&
    PLAN_REGISTRY[TENANT_PLAN.GROWTH].includes(capability) &&
    !PLAN_REGISTRY[TENANT_PLAN.FREE].includes(capability),
).map(({ field }) => field);
const COMING_SOON_FIELDS = CAPABILITY_TOGGLES.filter(
  ({ isComingSoon }) => isComingSoon,
).map(({ field }) => field);
const PLAN_GATED_ON = Object.fromEntries(
  PLAN_GATED_FIELDS.map((field) => [field, true]),
);
const COMING_SOON_ON = Object.fromEntries(
  COMING_SOON_FIELDS.map((field) => [field, true]),
);

const VALID_INPUT: TUpdateFeaturesInput = mockSettingsFeaturesValues({
  consentBannerEnabled: true,
});
const ALL_OFF: TUpdateFeaturesInput = mockSettingsFeaturesValues();

const arrangeTenantPlan = (
  plan: typeof TENANT_PLAN.FREE | typeof TENANT_PLAN.GROWTH,
  id = MOCK_TENANT_ID,
) => {
  vi.mocked(requireTenantMembership).mockResolvedValueOnce(
    mockMembershipContext(
      mockTenant({ id, plan }),
      mockMembership({ tenantId: id }),
    ),
  );
};

const arrangeStoredValues = (values: TUpdateFeaturesInput) => {
  getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
    values,
    savedAt: MOCK_SAVED_AT,
  });
};

describe(updateFeaturesAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    upsertSettingsFeaturesMock.mockReset();
    insertAuditEventMock.mockReset();
    getSettingsFeaturesOrDefaultsMock.mockReset();
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: ALL_OFF,
      savedAt: undefined,
    });
    getStoredTenantAnalyticsMock.mockReset();
    getStoredTenantAnalyticsMock.mockResolvedValue(undefined);
  });

  it('re-resolves the tenant from the session before writing', async () => {
    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockEditorMembershipContext(mockTenant({ id: MOCK_TENANT_ID })),
    );

    await expect(
      updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('saves for an operator', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOperatorMembershipContext(
        mockTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      ),
    );

    await expect(
      updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  describe('once saved', () => {
    beforeEach(async () => {
      await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);
    });

    it('revalidates the site config after a successful save', () => {
      expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });

    it('records a SETTINGS_UPDATED audit event with the operator as actor', () => {
      expect(insertAuditEventMock).toHaveBeenCalledWith({
        actorId: MOCK_OPERATOR_ID,
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
        targetId: MOCK_TENANT_ID,
        details: VALID_INPUT,
      });
    });
  });

  it('rejects a non-boolean field before reaching the tenant gate', async () => {
    const invalidInput = { ...VALID_INPUT, commentsEnabled: 'yes' };

    // @ts-expect-error -- a non-boolean toggle is the invalid payload under test
    const result = await updateFeaturesAction(MOCK_TENANT_ID, invalidInput);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
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
        values: { plan: TENANT_PLAN.FREE },
        items: [field],
      });
      expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfig).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it.each(PLAN_GATED_FIELDS)(
    'lets a GROWTH tenant switch %s on',
    async (field) => {
      arrangeTenantPlan(TENANT_PLAN.GROWTH, MOCK_OTHER_TENANT_ID);
      const input = {
        ...VALID_INPUT,
        readerAccountsEnabled: true,
        [field]: true,
      };

      const result = await updateFeaturesAction(MOCK_OTHER_TENANT_ID, input);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_OTHER_TENANT_ID,
        input,
      );
    },
  );

  it('keeps the stored out-of-plan toggles when a downgraded FREE tenant saves', async () => {
    arrangeStoredValues({
      ...ALL_OFF,
      bookmarksEnabled: true,
      analyticsEnabled: true,
      contactFormEnabled: true,
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
    arrangeStoredValues({ ...ALL_OFF, ...COMING_SOON_ON });

    await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      VALID_INPUT,
    );
  });

  it('saves a downgraded FREE tenant page that still sends its stored out-of-plan toggles on', async () => {
    arrangeStoredValues({
      ...ALL_OFF,
      analyticsEnabled: true,
      contactFormEnabled: true,
    });
    const stalePageValues = {
      ...ALL_OFF,
      analyticsEnabled: true,
      contactFormEnabled: true,
      consentBannerEnabled: true,
    };

    const result = await updateFeaturesAction(MOCK_TENANT_ID, stalePageValues);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      stalePageValues,
    );
  });

  it('refuses a downgraded FREE tenant switching on an out-of-plan toggle stored off', async () => {
    arrangeStoredValues({ ...ALL_OFF, analyticsEnabled: true });

    const result = await updateFeaturesAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      analyticsEnabled: true,
      bookmarksEnabled: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
      values: { plan: TENANT_PLAN.FREE },
      items: ['bookmarksEnabled'],
    });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  describe('for a GROWTH tenant', () => {
    beforeEach(() => {
      arrangeTenantPlan(TENANT_PLAN.GROWTH, MOCK_OTHER_TENANT_ID);
    });

    it('lets every plan-gated toggle be switched back off', async () => {
      arrangeStoredValues({ ...ALL_OFF, ...PLAN_GATED_ON });

      await updateFeaturesAction(MOCK_OTHER_TENANT_ID, VALID_INPUT);

      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_OTHER_TENANT_ID,
        VALID_INPUT,
      );
    });

    it('keeps Bookmarks off when it is switched on with Reader accounts off', async () => {
      const result = await updateFeaturesAction(MOCK_OTHER_TENANT_ID, {
        ...VALID_INPUT,
        bookmarksEnabled: true,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_OTHER_TENANT_ID,
        VALID_INPUT,
      );
    });

    it('keeps stored Bookmarks when Reader accounts is switched off', async () => {
      const stored = {
        ...VALID_INPUT,
        readerAccountsEnabled: true,
        bookmarksEnabled: true,
      };
      arrangeStoredValues(stored);
      const input = { ...stored, readerAccountsEnabled: false };

      await updateFeaturesAction(MOCK_OTHER_TENANT_ID, input);

      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_OTHER_TENANT_ID,
        input,
      );
    });
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.GROWTH])(
    'writes "Coming soon" toggles off for a %s tenant switching them on',
    async (plan) => {
      arrangeTenantPlan(plan);

      const result = await updateFeaturesAction(MOCK_TENANT_ID, {
        ...VALID_INPUT,
        ...COMING_SOON_ON,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        VALID_INPUT,
      );
    },
  );

  describe('while a Google Analytics id is stored', () => {
    beforeEach(() => {
      getStoredTenantAnalyticsMock.mockResolvedValue(MOCK_GOOGLE_ANALYTICS);
    });

    it('refuses switching the consent banner off, and writes nothing', async () => {
      const result = await updateFeaturesAction(MOCK_TENANT_ID, ALL_OFF);

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          consentBannerEnabled: {
            reason: FEATURES_FIELD_ERROR.CONSENT_BANNER_REQUIRED,
          },
        },
      });
      expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfig).not.toHaveBeenCalled();
    });

    it('saves with the consent banner on', async () => {
      const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    });
  });

  it('lets the consent banner be switched off while a Plausible domain is stored', async () => {
    getStoredTenantAnalyticsMock.mockResolvedValue(MOCK_PLAUSIBLE_ANALYTICS);

    const result = await updateFeaturesAction(MOCK_TENANT_ID, ALL_OFF);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      ALL_OFF,
    );
  });

  it('reports a server error when reading the stored toggles fails', async () => {
    getSettingsFeaturesOrDefaultsMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('reports a server error when the write fails', async () => {
    upsertSettingsFeaturesMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write fails, and logs the failure', async () => {
    const auditError = new Error(MOCK_DB_ERROR_MESSAGE);
    insertAuditEventMock.mockRejectedValue(auditError);

    const result = await updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.error).toHaveBeenCalledWith(
      SETTINGS_FEATURES_LOG.UPDATE_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
        targetId: MOCK_TENANT_ID,
        errorName: auditError.name,
      },
    );
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (navigationError) => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      throw new Error(navigationError);
    });

    await expect(
      updateFeaturesAction(MOCK_TENANT_ID, VALID_INPUT),
    ).rejects.toThrow(navigationError);

    expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
  });
});
