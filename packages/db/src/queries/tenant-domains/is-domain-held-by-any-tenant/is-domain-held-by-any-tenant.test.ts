import { TENANT_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
  insertTestTenantDomain,
} from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@shinefold/db/testing/tenants/fixtures';

import { isDomainHeldByAnyTenant } from './is-domain-held-by-any-tenant';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(isDomainHeldByAnyTenant, () => {
  it('is true for a domain held as a tenant_domains row', async () => {
    const tenant = await insertTestTenant(db());
    await insertTestTenantDomain(db(), tenant.id, MOCK_WWW_TENANT_DOMAIN);

    expect(await isDomainHeldByAnyTenant(MOCK_WWW_TENANT_DOMAIN)).toBe(true);
  });

  it('is true for a domain held by an archived tenant', async () => {
    await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
      status: TENANT_STATUS.ARCHIVED,
    });

    expect(await isDomainHeldByAnyTenant(MOCK_TENANT_DOMAIN)).toBe(true);
  });

  describe('with a tenant on its primary domain', () => {
    beforeEach(async () => {
      await insertTestTenant(db(), { primaryDomain: MOCK_TENANT_DOMAIN });
    });

    it('is true for a primaryDomain with no tenant_domains row', async () => {
      expect(await isDomainHeldByAnyTenant(MOCK_TENANT_DOMAIN)).toBe(true);
    });

    it('is false for a domain no tenant holds', async () => {
      expect(await isDomainHeldByAnyTenant(MOCK_MISSING_TENANT_DOMAIN)).toBe(
        false,
      );
    });
  });
});
