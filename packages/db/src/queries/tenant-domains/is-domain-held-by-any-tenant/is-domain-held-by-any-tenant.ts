import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants } from '@blog/db/schema/tenants';
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
