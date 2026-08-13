import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Not wired into any request path yet (Phase 8, per the tenant-config
// design doc) — resolves a tenant via `tenant_domains`, the source of truth
// for "which domains route here", rather than `tenants.primaryDomain`
// (a display-only pointer at which of those domains is canonical).
export async function getTenantByDomain(
  domain: string,
): Promise<TTenant | undefined> {
  const db = getDb();

  const [row] = await db
    .select({ tenant: tenants })
    .from(tenantDomains)
    .innerJoin(tenants, eq(tenantDomains.tenantId, tenants.id))
    .where(eq(tenantDomains.domain, domain));

  return row?.tenant;
}
