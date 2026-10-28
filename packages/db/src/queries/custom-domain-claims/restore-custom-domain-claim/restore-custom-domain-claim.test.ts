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

import { restoreCustomDomainClaim } from './restore-custom-domain-claim';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const ORIGINAL_TOKEN = 'a'.repeat(64);
const OTHER_TOKEN = 'b'.repeat(64);

afterEach(async () => {
  await db().delete(schema.customDomainClaims);
  await db().delete(schema.tenants);
});

describe(restoreCustomDomainClaim, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
  });

  it('recreates the claim with the given token', async () => {
    const result = await restoreCustomDomainClaim({
      tenantId,
      domain: MOCK_SHARED_TENANT_DOMAIN,
      token: ORIGINAL_TOKEN,
    });

    const [row] = await db().select().from(schema.customDomainClaims);
    expect(result).toEqual({ ok: true, data: row });
    expect(row?.token).toBe(ORIGINAL_TOKEN);
    expect(row?.domain).toBe(MOCK_SHARED_TENANT_DOMAIN);
  });

  it('refuses when the site already has a claim and keeps it', async () => {
    await restoreCustomDomainClaim({
      tenantId,
      domain: MOCK_SHARED_TENANT_DOMAIN,
      token: ORIGINAL_TOKEN,
    });

    const result = await restoreCustomDomainClaim({
      tenantId,
      domain: MOCK_OTHER_TENANT_DOMAIN,
      token: OTHER_TOKEN,
    });

    const rows = await db().select().from(schema.customDomainClaims);
    expect(result).toEqual(errorResult(ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.token).toBe(ORIGINAL_TOKEN);
  });

  it('rejects an invalid domain without writing a row', async () => {
    const result = await restoreCustomDomainClaim({
      tenantId,
      domain: `https://${MOCK_SHARED_TENANT_DOMAIN}`,
      token: ORIGINAL_TOKEN,
    });

    const rows = await db().select().from(schema.customDomainClaims);
    expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_DOMAIN));
    expect(rows).toEqual([]);
  });
});
