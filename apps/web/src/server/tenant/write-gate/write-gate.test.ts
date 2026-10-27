import { TENANT_WRITE_REFUSAL, type TMaybeUndefined } from '@blog/config';
import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { TENANT_WRITE_LOG } from '@web/constants/tenant-write';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_SUSPENDED_TENANT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  isRequestTenantActive,
  isTenantActive,
  resolveWritableTenant,
} from './write-gate';

faker.seed(5776);

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
}));

const MOCK_SITE = 'newsletter.subscribe';

const MOCK_ACTIVE_ROW: [boolean, string, TTenant] = [
  true,
  'an active tenant',
  mockTenant(),
];
const MOCK_SUSPENDED_ROW: [boolean, string, TTenant] = [
  false,
  'a suspended tenant',
  MOCK_SUSPENDED_TENANT,
];

describe(resolveWritableTenant, () => {
  it('returns the tenant id for an ACTIVE tenant', async () => {
    await expect(resolveWritableTenant(MOCK_SITE)).resolves.toEqual(
      okResult(MOCK_TENANT_ID),
    );
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'refuses a %s tenant as INACTIVE without logging',
    async (status) => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(
        mockTenant({ status }),
      );

      await expect(resolveWritableTenant(MOCK_SITE)).resolves.toEqual(
        errorResult(TENANT_WRITE_REFUSAL.INACTIVE),
      );
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it('refuses an unresolved tenant as UNRESOLVED and logs the site', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    await expect(resolveWritableTenant(MOCK_SITE)).resolves.toEqual(
      errorResult(TENANT_WRITE_REFUSAL.UNRESOLVED),
    );
    expect(logger.error).toHaveBeenCalledWith(TENANT_WRITE_LOG.UNRESOLVED, {
      site: MOCK_SITE,
    });
  });

  it('resolves the tenant row exactly once', async () => {
    await resolveWritableTenant(MOCK_SITE);

    expect(resolveRequestTenant).toHaveBeenCalledTimes(1);
  });
});

describe(isTenantActive, () => {
  it.each<[boolean, string, TTenant]>([
    MOCK_ACTIVE_ROW,
    MOCK_SUSPENDED_ROW,
    [
      false,
      'an archived tenant',
      mockTenant({ status: TENANT_STATUS.ARCHIVED }),
    ],
    [
      false,
      'a deprovisioned tenant still marked active',
      mockTenant({ deprovisionedAt: faker.date.past() }),
    ],
  ])('returns %s for %s', (expected, _, tenant) => {
    expect(isTenantActive(tenant)).toBe(expected);
  });
});

describe(isRequestTenantActive, () => {
  it.each<[boolean, string, TMaybeUndefined<TTenant>]>([
    MOCK_ACTIVE_ROW,
    MOCK_SUSPENDED_ROW,
    [false, 'no resolved tenant', undefined],
  ])('is %s when the request resolves %s', async (expected, _, tenant) => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(tenant);

    await expect(isRequestTenantActive()).resolves.toBe(expected);
  });

  it.each([
    {
      route: 'a resolved tenant',
      tenantId: MOCK_REQUEST_CONTEXT.tenantId,
      expected: MOCK_REQUEST_CONTEXT.tenantId,
    },
    {
      route: 'no tenant',
      tenantId: undefined,
      expected: UNRESOLVED_TENANT_PLACEHOLDER,
    },
  ])(
    'resolves the expected tenant when the route found $route',
    async ({ tenantId, expected }) => {
      vi.mocked(getRequestContext).mockResolvedValueOnce({
        ...MOCK_REQUEST_CONTEXT,
        tenantId,
      });

      await isRequestTenantActive();

      expect(resolveRequestTenant).toHaveBeenCalledWith(expected);
    },
  );
});
