import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { and, eq, notExists } from 'drizzle-orm';

export async function removeTenantDomain(
  tenantId: string,
  domain: string,
): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(tenantDomains)
    .where(
      and(
        eq(tenantDomains.tenantId, tenantId),
        eq(tenantDomains.domain, domain),
        notExists(
          db
            .select({ id: tenants.id })
            .from(tenants)
            .where(
              and(eq(tenants.id, tenantId), eq(tenants.primaryDomain, domain)),
            ),
        ),
      ),
    )
    .returning({ domain: tenantDomains.domain });

  return deleted.length > 0;
}
