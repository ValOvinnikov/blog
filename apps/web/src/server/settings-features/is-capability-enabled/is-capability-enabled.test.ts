import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import {
  EFFECTIVE_FETCH_FAILED_EVENT,
  PLAN_FETCH_FAILED_EVENT,
} from '@web/constants/settings-features';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from './is-capability-enabled';

vi.mock(
  '@web/server/settings-features/get-tenant-plan/get-tenant-plan',
  () => ({
    getTenantPlan: vi.fn(),
  }),
);
vi.mock('@web/server/request-context/request-context');
vi.mock(
  '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features',
  () => ({
    getEffectiveSettingsFeatures: vi.fn(),
  }),
);

vi.mock('@blog/db', () => vi.importActual('@blog/db/constants'));

const ALL_ENABLED = {
  [CAPABILITY.COMMENTS]: true,
  [CAPABILITY.RATINGS]: true,
  [CAPABILITY.BOOKMARKS]: true,
  [CAPABILITY.NEWSLETTER]: true,
  [CAPABILITY.ANALYTICS]: true,
  [CAPABILITY.CONSENT_BANNER]: true,
  [CAPABILITY.CONTACT_FORM]: true,
};

describe(isCapabilityEnabled, () => {
  beforeEach(() => {
    vi.mocked(getTenantPlan).mockReset();
    vi.mocked(getEffectiveSettingsFeatures).mockReset();
    vi.mocked(getTenantPlan).mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
      okResult(ALL_ENABLED),
    );
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
      vi.mocked(getTenantPlan).mockResolvedValue(okResult(plan));
      vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(
        okResult({ ...ALL_ENABLED, [capability]: isToggledOn }),
      );

      await expect(isCapabilityEnabled(capability)).resolves.toBe(expected);
    },
  );

  it('resolves false when no tenant is resolved for either read', async () => {
    vi.mocked(getTenantPlan).mockResolvedValue(okResult());
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(okResult());

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
  });

  it('resolves false and logs when the plan fetch fails', async () => {
    const planResult = errorResult(MOCK_ERROR);
    vi.mocked(getTenantPlan).mockResolvedValue(planResult);

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      PLAN_FETCH_FAILED_EVENT,
      { capability: CAPABILITY.COMMENTS, error: planResult.error },
    );
  });

  it('resolves false and logs when the effective features fetch fails', async () => {
    const featuresResult = errorResult(MOCK_ERROR);
    vi.mocked(getEffectiveSettingsFeatures).mockResolvedValue(featuresResult);

    await expect(isCapabilityEnabled(CAPABILITY.COMMENTS)).resolves.toBe(false);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      EFFECTIVE_FETCH_FAILED_EVENT,
      { capability: CAPABILITY.COMMENTS, error: featuresResult.error },
    );
  });

  it("reads both entitlements for the request context's tenant", async () => {
    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('reads the unresolved-tenant placeholder when the request has no tenant', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await isCapabilityEnabled(CAPABILITY.NEWSLETTER);

    expect(getTenantPlan).toHaveBeenCalledWith(UNRESOLVED_TENANT_PLACEHOLDER);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(
      UNRESOLVED_TENANT_PLACEHOLDER,
    );
  });

  it('reads both entitlements for a given tenant, without the request context', async () => {
    vi.mocked(getRequestContext).mockClear();

    await expect(
      isCapabilityEnabledForTenant(
        MOCK_OTHER_TENANT_ID,
        CAPABILITY.CONTACT_FORM,
      ),
    ).resolves.toBe(true);

    expect(getRequestContext).not.toHaveBeenCalled();
    expect(getTenantPlan).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
    expect(getEffectiveSettingsFeatures).toHaveBeenCalledWith(
      MOCK_OTHER_TENANT_ID,
    );
  });
});
