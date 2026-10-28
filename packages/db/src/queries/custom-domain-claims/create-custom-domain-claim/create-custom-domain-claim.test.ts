import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_SHARED_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';
import { errorResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import { createCustomDomainClaim } from './create-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenants);
});

describe(createCustomDomainClaim, () => {
  let tenantId: string;
  let otherTenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
    ({ id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    }));
  });

  it('stores the claim with a 256-bit hex token', async () => {
    const result = await createCustomDomainClaim(
      tenantId,
      MOCK_SHARED_TENANT_DOMAIN,
    );

    const [row] = await db().select().from(schema.customDomainClaims);
    expect(result).toEqual({ ok: true, data: row });
    expect(row?.tenantId).toBe(tenantId);
    expect(row?.domain).toBe(MOCK_SHARED_TENANT_DOMAIN);
    expect(row?.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('lets two sites claim the same domain with different tokens', async () => {
    const first = await createCustomDomainClaim(
      tenantId,
      MOCK_SHARED_TENANT_DOMAIN,
    );
    const second = await createCustomDomainClaim(
      otherTenantId,
      MOCK_SHARED_TENANT_DOMAIN,
    );

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.data.token).not.toBe(second.data.token);
    }
  });

  it('rejects an invalid domain without writing a row', async () => {
    const result = await createCustomDomainClaim(
      tenantId,
      `https://${MOCK_SHARED_TENANT_DOMAIN}`,
    );

    const rows = await db().select().from(schema.customDomainClaims);
    expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_DOMAIN));
    expect(rows).toEqual([]);
  });

  describe('when the site already has a claim', () => {
    beforeEach(async () => {
      await createCustomDomainClaim(tenantId, MOCK_SHARED_TENANT_DOMAIN);
    });

    it('refuses a second claim for the same site and keeps the first', async () => {
      const result = await createCustomDomainClaim(
        tenantId,
        MOCK_OTHER_TENANT_DOMAIN,
      );

      const rows = await db().select().from(schema.customDomainClaims);
      expect(result).toEqual(errorResult(ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.domain).toBe(MOCK_SHARED_TENANT_DOMAIN);
    });

    it('removes its claim when the owning tenant is deleted', async () => {
      await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

      const rows = await db().select().from(schema.customDomainClaims);
      expect(rows).toEqual([]);
    });
  });
});
