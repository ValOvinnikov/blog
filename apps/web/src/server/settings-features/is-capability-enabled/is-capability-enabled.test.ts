import { CAPABILITY, type TCapability } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import {
  EFFECTIVE_FETCH_FAILED_EVENT,
  PLAN_FETCH_FAILED_EVENT,
} from '@web/constants/settings-features';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { mockSettingsFeaturesRowEnabling } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from './is-capability-enabled';

faker.seed(6010);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual('@blog/db/constants')),
  queries: {
    tenants: { getTenantById: vi.fn() },
    settingsFeatures: { getSettingsFeatures: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const getSettingsFeaturesMock = vi.mocked(
  queries.settingsFeatures.getSettingsFeatures,
);

const arrangeTenant = (plan: TTenantPlan, enabled: readonly TCapability[]) => {
  getTenantByIdMock.mockResolvedValue(mockTenant({ plan }));
  getSettingsFeaturesMock.mockResolvedValue(
    mockSettingsFeaturesRowEnabling(enabled),
  );
};

describe(isCapabilityEnabled, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    vi.mocked(queries.siteConfig.getSiteConfig).mockReset();
    vi.mocked(getRequestTenantId).mockReset();
    arrangeTenant(TENANT_PLAN.GROWTH, Object.values(CAPABILITY));
  });

  it.each([
    [true, CAPABILITY.NEWSLETTER, TENANT_PLAN.GROWTH, true],
    [false, CAPABILITY.NEWSLETTER, TENANT_PLAN.FREE, true],
    [false, CAPABILITY.NEWSLETTER, TENANT_PLAN.GROWTH, false],
    [true, CAPABILITY.CONTACT_FORM, TENANT_PLAN.GROWTH, true],
    [false, CAPABILITY.CONTACT_FORM, TENANT_PLAN.GROWTH, false],
    [false, CAPABILITY.CONTACT_FORM, TENANT_PLAN.FREE, true],
  ])(
    'resolves %s for %s on %s when its toggle is %s',
    async (expected, capability, plan, isToggledOn) => {
      arrangeTenant(plan, isToggledOn ? [capability] : []);

      await expect(isCapabilityEnabled(capability)).resolves.toBe(expected);
    },
  );

  it('resolves false when no tenant is resolved for either read', async () => {
    vi.mocked(getRequestTenantId)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the plan fetch fails', async () => {
    getTenantByIdMock.mockRejectedValue(MOCK_ERROR);

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(PLAN_FETCH_FAILED_EVENT, {
      capability: CAPABILITY.COMMENTS,
      error: MOCK_ERROR,
    });
  });

  it('resolves false and logs when the effective features fetch fails', async () => {
    getSettingsFeaturesMock.mockRejectedValue(MOCK_ERROR);

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith(EFFECTIVE_FETCH_FAILED_EVENT, {
      capability: CAPABILITY.COMMENTS,
      error: MOCK_ERROR,
    });
  });

  describe('tenant resolution', () => {
    beforeEach(() => {
      vi.mocked(getRequestTenantId).mockImplementation(
        async (tenant) => tenant,
      );
    });

    it("reads both entitlements for the request context's tenant", async () => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        tenantId: MOCK_OTHER_TENANT_ID,
      });

      await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

      expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID, {
        includeArchived: true,
      });
      expect(getSettingsFeaturesMock).toHaveBeenCalledWith(
        MOCK_OTHER_TENANT_ID,
      );
    });

    it('reads the unresolved-tenant placeholder when the request has no tenant', async () => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        tenantId: undefined,
      });

      await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

      expect(getTenantByIdMock).toHaveBeenCalledWith(
        UNRESOLVED_TENANT_PLACEHOLDER,
        { includeArchived: true },
      );
      expect(getSettingsFeaturesMock).toHaveBeenCalledWith(
        UNRESOLVED_TENANT_PLACEHOLDER,
      );
    });

    it('reads both entitlements for a given tenant, without the request context', async () => {
      await expect(
        isCapabilityEnabledForTenant(MOCK_TENANT_ID, CAPABILITY.CONTACT_FORM),
      ).resolves.toBe(true);

      expect(getRequestContext).not.toHaveBeenCalled();
      expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        includeArchived: true,
      });
      expect(getSettingsFeaturesMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    });
  });
});
