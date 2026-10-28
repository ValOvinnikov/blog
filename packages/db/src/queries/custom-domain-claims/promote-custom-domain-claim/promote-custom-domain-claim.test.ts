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

import { promoteCustomDomainClaim } from './promote-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(promoteCustomDomainClaim, () => {
  let tenantId: string;
  let otherTenantId: string;

  async function insertClaim(forTenantId: string) {
    const [claim] = await db()
      .insert(schema.customDomainClaims)
      .values({
        tenantId: forTenantId,
        domain: MOCK_SHARED_TENANT_DOMAIN,
        token: `token-${forTenantId}`,
      })
      .returning();
    if (!claim) throw new Error('claim not inserted');
    return claim;
  }

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
    ({ id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    }));
  });

  it('writes the tenant domain and removes the claim', async () => {
    const claim = await insertClaim(tenantId);

    const result = await promoteCustomDomainClaim(tenantId, claim.id);

    const domains = await db().select().from(schema.tenantDomains);
    const claims = await db().select().from(schema.customDomainClaims);
    expect(domains).toHaveLength(1);
    expect(domains[0]?.tenantId).toBe(tenantId);
    expect(domains[0]?.domain).toBe(MOCK_SHARED_TENANT_DOMAIN);
    expect(result).toEqual({ ok: true, data: domains[0] });
    expect(claims).toEqual([]);
  });

  it('keeps the claim and reports a duplicate when another site holds the domain', async () => {
    const claim = await insertClaim(tenantId);
    await db()
      .insert(schema.tenantDomains)
      .values({ tenantId: otherTenantId, domain: MOCK_SHARED_TENANT_DOMAIN });

    const result = await promoteCustomDomainClaim(tenantId, claim.id);

    const claims = await db().select().from(schema.customDomainClaims);
    const domains = await db().select().from(schema.tenantDomains);
    expect(result).toEqual(errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN));
    expect(claims).toEqual([claim]);
    expect(domains).toHaveLength(1);
  });

  it("returns DB_NOT_FOUND for another site's claim and leaves it", async () => {
    const claim = await insertClaim(otherTenantId);

    const result = await promoteCustomDomainClaim(tenantId, claim.id);

    const claims = await db().select().from(schema.customDomainClaims);
    const domains = await db().select().from(schema.tenantDomains);
    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
    expect(claims).toEqual([claim]);
    expect(domains).toEqual([]);
  });

  it('returns DB_NOT_FOUND when the claim is gone', async () => {
    const claim = await insertClaim(tenantId);
    await db().delete(schema.customDomainClaims);

    const result = await promoteCustomDomainClaim(tenantId, claim.id);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
  });
});
