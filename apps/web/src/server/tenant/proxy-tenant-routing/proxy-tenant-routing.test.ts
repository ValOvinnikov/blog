import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { selectProxyTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';
import { mockServableTenant } from '@web/testing/server/tenant/fixtures';
import {
  MOCK_LOCAL_HOST,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import {
  resolveProxyTenant,
  resolveTenantRouting,
} from './proxy-tenant-routing';

faker.seed(4418);

vi.mock('@web/utils/is-production-environment');
vi.mock('@web/server/tenant/tenant-live-locales/tenant-live-locales');
vi.mock('@web/server/tenant/proxy-tenant-cache/proxy-tenant-cache');
vi.mock('@shinefold/db', async () => ({
  ...(await import('@shinefold/db/constants')),
  queries: {
    tenantDomains: { getTenantByDomain: vi.fn() },
    tenants: { listTenants: vi.fn() },
  },
}));

const MOCK_UNKNOWN_HOST = faker.internet.domainName();
const MOCK_SECONDARY_HOST = faker.internet.domainName();

const MOCK_LIVE_LOCALES = [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.DE];

const MOCK_TENANT = mockServableTenant();

beforeEach(() => {
  vi.resetAllMocks();
});

describe(resolveProxyTenant, () => {
  it('resolves the tenant owning the host', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      MOCK_TENANT,
    );

    await expect(resolveProxyTenant(MOCK_TENANT_HOST)).resolves.toEqual(
      MOCK_TENANT,
    );
  });

  it('resolves undefined for a host no tenant owns', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      undefined,
    );

    await expect(
      resolveProxyTenant(MOCK_UNKNOWN_HOST),
    ).resolves.toBeUndefined();
  });
});

describe(resolveTenantRouting, () => {
  describe('for a host a tenant owns', () => {
    beforeEach(() => {
      vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
        MOCK_TENANT,
      );
    });

    it('resolves the routing for the tenant owning the host', async () => {
      vi.mocked(selectProxyTenantLiveLocales).mockResolvedValue(
        MOCK_LIVE_LOCALES,
      );

      await expect(resolveTenantRouting(MOCK_TENANT_HOST)).resolves.toEqual({
        tenant: MOCK_TENANT,
        tenantId: MOCK_TENANT_ID,
        defaultLocale: MOCK_TENANT.locale,
        liveLocales: MOCK_LIVE_LOCALES,
        isSecondaryHost: false,
      });
      expect(selectProxyTenantLiveLocales).toHaveBeenCalledWith(MOCK_TENANT);
    });

    it('marks a host that is not its main address as secondary', async () => {
      await expect(
        resolveTenantRouting(MOCK_SECONDARY_HOST),
      ).resolves.toMatchObject({ isSecondaryHost: true });
    });
  });

  describe('for a host no tenant owns', () => {
    beforeEach(() => {
      vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
        undefined,
      );
    });

    it('never marks the sole-tenant fallback as secondary', async () => {
      vi.mocked(queries.tenants.listTenants).mockResolvedValue([MOCK_TENANT]);

      await expect(
        resolveTenantRouting(MOCK_LOCAL_HOST),
      ).resolves.toMatchObject({
        tenantId: MOCK_TENANT_ID,
        isSecondaryHost: false,
      });
    });

    it('resolves undefined with no sole tenant to fall back to', async () => {
      vi.mocked(queries.tenants.listTenants).mockResolvedValue([]);

      await expect(
        resolveTenantRouting(MOCK_UNKNOWN_HOST),
      ).resolves.toBeUndefined();
      expect(selectProxyTenantLiveLocales).not.toHaveBeenCalled();
    });
  });
});
