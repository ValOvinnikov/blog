import { TENANT_PLAN } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { isModuleEntitled } from './is-module-entitled';

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/settings-features/get-tenant-plan/get-tenant-plan');

const getRequestContextMock = vi.mocked(getRequestContext);
const getTenantPlanMock = vi.mocked(getTenantPlan);

const CORE_MODULE_TYPE = 'module_cta';
const CORE_HERO_TYPE = 'module_heroBlog';
const GROWTH_MODULE_TYPE = 'module_stats';

describe(isModuleEntitled, () => {
  beforeEach(() => {
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
    getTenantPlanMock.mockReset();
    getTenantPlanMock.mockResolvedValue(okResult(TENANT_PLAN.GROWTH));
  });

  it.each([
    [true, CORE_MODULE_TYPE, TENANT_PLAN.FREE],
    [true, CORE_HERO_TYPE, TENANT_PLAN.FREE],
    [false, GROWTH_MODULE_TYPE, TENANT_PLAN.FREE],
    [true, CORE_MODULE_TYPE, TENANT_PLAN.GROWTH],
    [true, GROWTH_MODULE_TYPE, TENANT_PLAN.GROWTH],
  ])('resolves %s for %s on %s', async (expected, moduleType, plan) => {
    getTenantPlanMock.mockResolvedValue(okResult(plan));

    await expect(isModuleEntitled(moduleType)).resolves.toBe(expected);
  });

  it('reads the plan for the tenant the request context resolved', async () => {
    await isModuleEntitled(CORE_MODULE_TYPE);

    expect(getTenantPlanMock).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
  });

  it('entitles every module type without reading a plan when no tenant resolved', async () => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await expect(isModuleEntitled(GROWTH_MODULE_TYPE)).resolves.toBe(true);
    expect(getTenantPlanMock).not.toHaveBeenCalled();
  });

  it.each([
    [true, CORE_MODULE_TYPE],
    [false, GROWTH_MODULE_TYPE],
  ])(
    'resolves %s for %s and logs the failure when the plan cannot be read',
    async (expected, moduleType) => {
      getTenantPlanMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await expect(isModuleEntitled(moduleType)).resolves.toBe(expected);
      expect(logger.error).toHaveBeenCalledWith(
        MODULE_RENDERER_LOG.PLAN_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    },
  );

  it.each([
    [true, CORE_MODULE_TYPE],
    [false, GROWTH_MODULE_TYPE],
  ])(
    'resolves %s for %s when the tenant has no plan',
    async (expected, moduleType) => {
      getTenantPlanMock.mockResolvedValue(okResult(undefined));

      await expect(isModuleEntitled(moduleType)).resolves.toBe(expected);
    },
  );
});
