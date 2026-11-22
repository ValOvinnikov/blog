import { faker } from '@faker-js/faker';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import {
  ANALYTICS_FIELD_ERROR,
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
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import {
  type TMaybeNull,
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import {
  ANALYTICS_PROVIDER,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  MOCK_GOOGLE_ANALYTICS,
  MOCK_PLAUSIBLE_ANALYTICS,
} from '@shinefold/db/testing/tenant-analytics/fixtures';
import type { Session } from 'next-auth';

import {
  updateAnalyticsAction,
  type TUpdateAnalyticsInput,
} from './update-analytics-action';

faker.seed(7151);

const {
  saveTenantAnalyticsMock,
  clearTenantAnalyticsMock,
  upsertSettingsFeaturesMock,
  insertAuditEventMock,
  getSettingsFeaturesOrDefaultsMock,
} = vi.hoisted(() => ({
  saveTenantAnalyticsMock: vi.fn(),
  clearTenantAnalyticsMock: vi.fn(),
  upsertSettingsFeaturesMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  getSettingsFeaturesOrDefaultsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@shinefold/db/client', () => ({ getDb: vi.fn() }));

vi.mock(
  '@platform/server/settings-features/settings-features-or-defaults',
  () => ({ getSettingsFeaturesOrDefaults: getSettingsFeaturesOrDefaultsMock }),
);

vi.mock('@shinefold/db', async () => {
  const { saveTenantAnalyticsInputSchema } =
    await import('@shinefold/db/queries/tenant-analytics/save-tenant-analytics');

  return {
    ...(await mockDbConstants()),
    queries: {
      tenantAnalytics: {
        saveTenantAnalytics: saveTenantAnalyticsMock,
        clearTenantAnalytics: clearTenantAnalyticsMock,
        saveTenantAnalyticsInputSchema,
      },
      settingsFeatures: { upsertSettingsFeatures: upsertSettingsFeaturesMock },
      auditEvents: { insertAuditEvent: insertAuditEventMock },
    },
  };
});

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const GOOGLE_ANALYTICS_INPUT: TUpdateAnalyticsInput = {
  analyticsProvider: MOCK_GOOGLE_ANALYTICS.provider,
  analyticsId: MOCK_GOOGLE_ANALYTICS.analyticsId,
};
const PLAUSIBLE_INPUT: TUpdateAnalyticsInput = {
  analyticsProvider: MOCK_PLAUSIBLE_ANALYTICS.provider,
  analyticsId: MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
};
const CLEARED_INPUT: TUpdateAnalyticsInput = {
  analyticsProvider: ANALYTICS_PROVIDER.GOOGLE_ANALYTICS,
  analyticsId: ' ',
};
const MOCK_ID_INVALID_RESULT = {
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { analyticsId: { reason: ANALYTICS_FIELD_ERROR.ID_INVALID } },
};

const BANNER_OFF_FEATURES = mockSettingsFeaturesValues({
  contactFormEnabled: true,
});

const arrangeTenantPlan = (plan: TTenantPlan) => {
  vi.mocked(requireTenantMembership).mockResolvedValueOnce(
    mockMembershipContext(
      mockTenant({ id: MOCK_TENANT_ID, plan }),
      mockMembership({ tenantId: MOCK_TENANT_ID }),
    ),
  );
};

describe(updateAnalyticsAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getSettingsFeaturesOrDefaultsMock.mockResolvedValue({
      values: BANNER_OFF_FEATURES,
      savedAt: undefined,
    });
  });

  describe.each([TENANT_PLAN.STARTER, TENANT_PLAN.GROWTH])('on %s', (plan) => {
    beforeEach(() => {
      arrangeTenantPlan(plan);
    });

    it.each([GOOGLE_ANALYTICS_INPUT, PLAUSIBLE_INPUT])(
      'saves a $analyticsProvider id and revalidates the site',
      async (input) => {
        const result = await updateAnalyticsAction(MOCK_TENANT_ID, input);

        expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
        expect(saveTenantAnalyticsMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
          provider: input.analyticsProvider,
          analyticsId: input.analyticsId,
        });
        expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
      },
    );

    it('clears the id when it is blank', async () => {
      const result = await updateAnalyticsAction(MOCK_TENANT_ID, CLEARED_INPUT);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(clearTenantAnalyticsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(saveTenantAnalyticsMock).not.toHaveBeenCalled();
    });

    it.each([
      [
        'a Plausible domain saved as Google Analytics',
        {
          ...GOOGLE_ANALYTICS_INPUT,
          analyticsId: MOCK_PLAUSIBLE_ANALYTICS.analyticsId,
        },
      ],
      [
        'a measurement id saved as Plausible',
        {
          ...PLAUSIBLE_INPUT,
          analyticsId: MOCK_GOOGLE_ANALYTICS.analyticsId,
        },
      ],
    ])('refuses %s and writes nothing', async (_, input) => {
      const result = await updateAnalyticsAction(MOCK_TENANT_ID, input);

      expect(result).toEqual(MOCK_ID_INVALID_RESULT);
      expect(saveTenantAnalyticsMock).not.toHaveBeenCalled();
      expect(revalidateSiteConfig).not.toHaveBeenCalled();
    });

    it('records a SETTINGS_UPDATED audit event with the operator as actor', async () => {
      await updateAnalyticsAction(MOCK_TENANT_ID, PLAUSIBLE_INPUT);

      expect(insertAuditEventMock).toHaveBeenCalledWith({
        actorId: MOCK_OPERATOR_ID,
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
        targetId: MOCK_TENANT_ID,
        details: {
          analyticsProvider: PLAUSIBLE_INPUT.analyticsProvider,
          isCleared: false,
          isConsentBannerTurnedOn: false,
        },
      });
    });

    it('logs a failed write and returns a server error', async () => {
      saveTenantAnalyticsMock.mockRejectedValueOnce(
        new Error(faker.lorem.words(3)),
      );

      const result = await updateAnalyticsAction(
        MOCK_TENANT_ID,
        GOOGLE_ANALYTICS_INPUT,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(logger.error).toHaveBeenCalledWith(
        SETTINGS_FEATURES_LOG.ANALYTICS_UPDATE_FAILED,
        expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
      );
      expect(revalidateSiteConfig).not.toHaveBeenCalled();
    });
  });

  describe('the consent banner', () => {
    beforeEach(() => {
      arrangeTenantPlan(TENANT_PLAN.GROWTH);
    });

    describe('once a Google Analytics id is saved', () => {
      beforeEach(async () => {
        await updateAnalyticsAction(MOCK_TENANT_ID, GOOGLE_ANALYTICS_INPUT);
      });

      it('is switched on, keeping the other toggles', () => {
        expect(upsertSettingsFeaturesMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          { ...BANNER_OFF_FEATURES, consentBannerEnabled: true },
        );
      });

      it('is recorded as switched on in the audit event', () => {
        expect(insertAuditEventMock).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({ isConsentBannerTurnedOn: true }),
          }),
        );
      });
    });

    it('is left as it is when already on', async () => {
      getSettingsFeaturesOrDefaultsMock.mockResolvedValueOnce({
        values: { ...BANNER_OFF_FEATURES, consentBannerEnabled: true },
        savedAt: undefined,
      });

      await updateAnalyticsAction(MOCK_TENANT_ID, GOOGLE_ANALYTICS_INPUT);

      expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
    });

    it.each([
      ['a Plausible domain', PLAUSIBLE_INPUT],
      ['a cleared id', CLEARED_INPUT],
    ])('is left alone for %s', async (_, input) => {
      await updateAnalyticsAction(MOCK_TENANT_ID, input);

      expect(upsertSettingsFeaturesMock).not.toHaveBeenCalled();
    });

    it('leaves the id unsaved when switching it on fails', async () => {
      upsertSettingsFeaturesMock.mockRejectedValueOnce(
        new Error(faker.lorem.words(3)),
      );

      const result = await updateAnalyticsAction(
        MOCK_TENANT_ID,
        GOOGLE_ANALYTICS_INPUT,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(saveTenantAnalyticsMock).not.toHaveBeenCalled();
    });
  });

  describe('on Free', () => {
    beforeEach(() => {
      arrangeTenantPlan(TENANT_PLAN.FREE);
    });

    it('refuses setting an id as not in the plan, and writes nothing', async () => {
      const result = await updateAnalyticsAction(
        MOCK_TENANT_ID,
        GOOGLE_ANALYTICS_INPUT,
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
        values: { plan: TENANT_PLAN.FREE },
        items: ['analyticsId'],
      });
      expect(saveTenantAnalyticsMock).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        SETTINGS_FEATURES_LOG.PLAN_ENTITLEMENT_REJECTED,
        expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
      );
    });

    it('still clears a kept id', async () => {
      const result = await updateAnalyticsAction(MOCK_TENANT_ID, CLEARED_INPUT);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(clearTenantAnalyticsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });
  });

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockEditorMembershipContext(
        mockTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      ),
    );

    await expect(
      updateAnalyticsAction(MOCK_TENANT_ID, GOOGLE_ANALYTICS_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(saveTenantAnalyticsMock).not.toHaveBeenCalled();
    expect(clearTenantAnalyticsMock).not.toHaveBeenCalled();
  });

  it('saves for an operator', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOperatorMembershipContext(
        mockTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      ),
    );

    await expect(
      updateAnalyticsAction(MOCK_TENANT_ID, GOOGLE_ANALYTICS_INPUT),
    ).resolves.toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('rejects an unknown provider before reaching the tenant gate', async () => {
    const result = await updateAnalyticsAction(MOCK_TENANT_ID, {
      ...GOOGLE_ANALYTICS_INPUT,
      // @ts-expect-error -- an unknown provider is the invalid payload under test
      analyticsProvider: faker.lorem.word(),
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });
});
