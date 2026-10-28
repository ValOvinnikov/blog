import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_WWW_TENANT_DOMAIN,
} from '@blog/db/testing/tenant-domains/fixtures';
import { MOCK_TENANT_DOMAIN } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { removeTenantDomain } from './remove-tenant-domain';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantDomains);
  await db().delete(schema.tenants);
});

describe(removeTenantDomain, () => {
  let tenantId: string;
  let otherTenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_TENANT_DOMAIN,
    }));
    ({ id: otherTenantId } = await insertTestTenant(db(), {
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    }));
    await db()
      .insert(schema.tenantDomains)
      .values({ tenantId, domain: MOCK_WWW_TENANT_DOMAIN });
  });

  it('deletes the row for the matching tenant and domain', async () => {
    const removed = await removeTenantDomain(tenantId, MOCK_WWW_TENANT_DOMAIN);

    const rows = await db().select().from(schema.tenantDomains);
    expect(removed).toBe(true);
    expect(rows).toEqual([]);
  });

  it('keeps the row and returns false for another tenant', async () => {
    const removed = await removeTenantDomain(
      otherTenantId,
      MOCK_WWW_TENANT_DOMAIN,
    );

    const rows = await db().select().from(schema.tenantDomains);
    expect(removed).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it('returns false for an unknown domain', async () => {
    const removed = await removeTenantDomain(
      tenantId,
      MOCK_MISSING_TENANT_DOMAIN,
    );

    const rows = await db().select().from(schema.tenantDomains);
    expect(removed).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it('keeps the row and returns false when it is the main address', async () => {
    await db()
      .insert(schema.tenantDomains)
      .values({ tenantId, domain: MOCK_TENANT_DOMAIN });

    const removed = await removeTenantDomain(tenantId, MOCK_TENANT_DOMAIN);

    const rows = await db()
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, MOCK_TENANT_DOMAIN));
    expect(removed).toBe(false);
    expect(rows).toHaveLength(1);
  });
});
