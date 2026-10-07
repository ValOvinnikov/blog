import { TENANT_WRITE_REFUSAL } from '@blog/config';
import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

import { isTenantActive, resolveWritableTenant } from './write-gate';

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));
vi.mock('@web/utils/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));

const SITE = 'newsletter.subscribe';

describe(resolveWritableTenant, () => {
  beforeEach(() => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(logger.error).mockReset();
    vi.mocked(logger.warn).mockReset();
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
      status: TENANT_STATUS.ACTIVE,
    } as never);
  });

  it('returns the tenant id for an ACTIVE tenant', async () => {
    await expect(resolveWritableTenant(SITE)).resolves.toEqual({
      ok: true,
      tenantId: 'tenant-1',
    });
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'refuses a %s tenant as INACTIVE without logging',
    async (status) => {
      vi.mocked(resolveRequestTenant).mockResolvedValue({
        id: 'tenant-1',
        status,
      } as never);

      await expect(resolveWritableTenant(SITE)).resolves.toEqual({
        ok: false,
        reason: TENANT_WRITE_REFUSAL.INACTIVE,
      });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it('refuses an unresolved tenant as UNRESOLVED and logs the site', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(resolveWritableTenant(SITE)).resolves.toEqual({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    expect(logger.error).toHaveBeenCalledWith('tenant_write.unresolved', {
      site: SITE,
    });
  });

  it('resolves the tenant row exactly once', async () => {
    await resolveWritableTenant(SITE);

    expect(resolveRequestTenant).toHaveBeenCalledTimes(1);
  });
});

const buildTenant = (overrides: Partial<TTenant>) =>
  ({
    id: 'tenant-a',
    status: TENANT_STATUS.ACTIVE,
    deprovisionedAt: null,
    ...overrides,
  }) as TTenant;

describe(isTenantActive, () => {
  it('returns true for an active tenant', () => {
    expect(isTenantActive(buildTenant({}))).toBe(true);
  });

  it('returns false for a suspended tenant', () => {
    expect(
      isTenantActive(buildTenant({ status: TENANT_STATUS.SUSPENDED })),
    ).toBe(false);
  });

  it('returns false for an archived tenant', () => {
    expect(
      isTenantActive(buildTenant({ status: TENANT_STATUS.ARCHIVED })),
    ).toBe(false);
  });

  it('returns false for a deprovisioned tenant that is still marked active', () => {
    expect(isTenantActive(buildTenant({ deprovisionedAt: new Date() }))).toBe(
      false,
    );
  });
});
