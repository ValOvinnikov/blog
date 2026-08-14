import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

// Resolves via `tenant_domains`, the source of truth for "which domains
// route here" — `tenants.primaryDomain` is only a display pointer at which
// of those domains is canonical.
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
