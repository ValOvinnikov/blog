import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getEffectivePlan } from './get-effective-plan';

vi.mock('@web/server/settings-features/get-tenant-plan/get-tenant-plan');

const getTenantPlanMock = vi.mocked(getTenantPlan);

describe(getEffectivePlan, () => {
  it("returns the tenant's plan", async () => {
    getTenantPlanMock.mockResolvedValueOnce(okResult(TENANT_PLAN.GROWTH));

    await expect(getEffectivePlan(MOCK_TENANT_ID)).resolves.toBe(
      TENANT_PLAN.GROWTH,
    );
    expect(getTenantPlanMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('falls back to Free when the tenant has no plan', async () => {
    getTenantPlanMock.mockResolvedValueOnce(okResult());

    await expect(getEffectivePlan(MOCK_TENANT_ID)).resolves.toBe(
      TENANT_PLAN.FREE,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('falls back to Free and logs when the plan cannot be read', async () => {
    getTenantPlanMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(getEffectivePlan(MOCK_TENANT_ID)).resolves.toBe(
      TENANT_PLAN.FREE,
    );
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.PLAN_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
