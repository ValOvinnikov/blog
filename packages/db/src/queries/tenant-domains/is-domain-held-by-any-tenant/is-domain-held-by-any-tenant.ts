import { getDb } from '@shinefold/db/client';
import { tenantDomains } from '@shinefold/db/schema/tenant-domains';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function isDomainHeldByAnyTenant(
  domain: string,
): Promise<boolean> {
  const db = getDb();

  const [domainRow] = await db
    .select({ tenantId: tenantDomains.tenantId })
    .from(tenantDomains)
    .where(eq(tenantDomains.domain, domain))
    .limit(1);

  if (domainRow) return true;

  const [tenantRow] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.primaryDomain, domain))
    .limit(1);

  return Boolean(tenantRow);
}
