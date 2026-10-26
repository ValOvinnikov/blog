import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';

import { checkTenantSlug } from './check-tenant-slug';

const { getTenantByDomainMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { getTenantByDomain: getTenantByDomainMock } },
}));

describe(checkTenantSlug, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    getTenantByDomainMock.mockResolvedValue(undefined);
  });

  it('accepts a free, valid, unreserved slug', async () => {
    await expect(
      checkTenantSlug(MOCK_TENANT_SLUG, MOCK_TENANT_ROOT_DOMAIN),
    ).resolves.toBe(undefined);
    expect(getTenantByDomainMock).toHaveBeenCalledWith(MOCK_TENANT_DOMAIN);
  });

  it.each(['-acme', 'acme-', 'Acme', 'acme_blog', 'a'.repeat(64), ''])(
    'rejects %j as an invalid DNS label without querying the database',
    async (slug) => {
      await expect(
        checkTenantSlug(slug, MOCK_TENANT_ROOT_DOMAIN),
      ).resolves.toBe(TENANT_FIELD_ERROR.SLUG_INVALID);
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it.each(['admin', 'platform', 'studio', 'www', 'web-storybook'])(
    'rejects the reserved subdomain %s',
    async (slug) => {
      await expect(
        checkTenantSlug(slug, MOCK_TENANT_ROOT_DOMAIN),
      ).resolves.toBe(TENANT_FIELD_ERROR.SLUG_RESERVED);
      expect(getTenantByDomainMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a slug another tenant already holds', async () => {
    getTenantByDomainMock.mockResolvedValue({ id: 'tenant-2' });

    await expect(
      checkTenantSlug(MOCK_TENANT_SLUG, MOCK_TENANT_ROOT_DOMAIN),
    ).resolves.toBe(TENANT_FIELD_ERROR.SLUG_TAKEN);
  });
});
