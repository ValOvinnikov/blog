import { MODULE_PACK, TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { mockEntitlementGrant } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';
import { errorResult, okResult } from '@shinefold/utils';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTenantEntitlements } from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { isModuleEntitled } from './is-module-entitled';

vi.mock('@web/server/request-context/request-context');
vi.mock(
  '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements',
);

const getRequestContextMock = vi.mocked(getRequestContext);
const getTenantEntitlementsMock = vi.mocked(getTenantEntitlements);

const CORE_MODULE_TYPE = 'module_cta';
const CORE_HERO_TYPE = 'module_heroBlog';
const GROWTH_MODULE_TYPE = 'module_stats';

describe(isModuleEntitled, () => {
  beforeEach(() => {
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(MOCK_REQUEST_CONTEXT);
  });

  it.each([
    [true, CORE_MODULE_TYPE, TENANT_PLAN.FREE],
    [true, CORE_HERO_TYPE, TENANT_PLAN.FREE],
    [false, GROWTH_MODULE_TYPE, TENANT_PLAN.FREE],
    [true, CORE_MODULE_TYPE, TENANT_PLAN.GROWTH],
    [true, GROWTH_MODULE_TYPE, TENANT_PLAN.GROWTH],
  ])('resolves %s for %s on %s', async (expected, moduleType, plan) => {
    getTenantEntitlementsMock.mockResolvedValue(
      okResult(mockTenantEntitlements(plan)),
    );

    await expect(isModuleEntitled(moduleType)).resolves.toBe(expected);
  });

  it('entitles a module type from a granted pack on a plan without it', async () => {
    getTenantEntitlementsMock.mockResolvedValue(
      okResult(
        mockTenantEntitlements(TENANT_PLAN.FREE, [
          mockEntitlementGrant({
            kind: ENTITLEMENT_KIND.MODULE_PACK,
            key: MODULE_PACK.GROWTH,
          }),
        ]),
      ),
    );

    await expect(isModuleEntitled(GROWTH_MODULE_TYPE)).resolves.toBe(true);
  });

  it('reads the entitlements for the tenant the request context resolved', async () => {
    await isModuleEntitled(CORE_MODULE_TYPE);

    expect(getTenantEntitlementsMock).toHaveBeenCalledWith(
      MOCK_REQUEST_CONTEXT.tenantId,
    );
  });

  it('entitles every module type without reading entitlements when no tenant resolved', async () => {
    getRequestContextMock.mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await expect(isModuleEntitled(GROWTH_MODULE_TYPE)).resolves.toBe(true);
    expect(getTenantEntitlementsMock).not.toHaveBeenCalled();
  });

  it.each([
    [true, CORE_MODULE_TYPE],
    [false, GROWTH_MODULE_TYPE],
  ])(
    'resolves %s for %s and logs the failure when the entitlements cannot be read',
    async (expected, moduleType) => {
      getTenantEntitlementsMock.mockResolvedValue(errorResult(MOCK_ERROR));

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
    'resolves %s for %s when the tenant is unknown',
    async (expected, moduleType) => {
      getTenantEntitlementsMock.mockResolvedValue(okResult(undefined));

      await expect(isModuleEntitled(moduleType)).resolves.toBe(expected);
    },
  );
});
