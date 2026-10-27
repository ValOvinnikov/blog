import { RESERVED_SUBDOMAINS } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import {
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { checkTenantSlug } from './check-tenant-slug';

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { getTenantByDomain: vi.fn() } },
}));

const getTenantByDomainMock = vi.mocked(
  queries.tenantDomains.getTenantByDomain,
);

describe(checkTenantSlug, () => {
  it('accepts a free, valid, unreserved slug', async () => {
    getTenantByDomainMock.mockResolvedValueOnce(undefined);

    const result = await checkTenantSlug(
      MOCK_TENANT_SLUG,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBeUndefined();
    expect(getTenantByDomainMock).toHaveBeenCalledWith(
      `${MOCK_TENANT_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`,
    );
  });

  it.each(['-acme', 'acme-', 'Acme', 'acme_blog', 'a'.repeat(64), ''])(
    'rejects %j as an invalid DNS label without querying the database',
    async (slug) => {
      const result = await checkTenantSlug(slug, MOCK_TENANT_ROOT_DOMAIN);

      expect(result).toBe(TENANT_FIELD_ERROR.SLUG_INVALID);
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it.each(RESERVED_SUBDOMAINS)(
    'rejects the reserved subdomain %s without querying the database',
    async (slug) => {
      const result = await checkTenantSlug(slug, MOCK_TENANT_ROOT_DOMAIN);

      expect(result).toBe(TENANT_FIELD_ERROR.SLUG_RESERVED);
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a slug another tenant already holds', async () => {
    getTenantByDomainMock.mockResolvedValueOnce(mockTenant());

    const result = await checkTenantSlug(
      MOCK_TENANT_SLUG,
      MOCK_TENANT_ROOT_DOMAIN,
    );

    expect(result).toBe(TENANT_FIELD_ERROR.SLUG_TAKEN);
  });
});
