import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { and, eq } from 'drizzle-orm';

export async function removeTenantDomain(
  tenantId: string,
  domain: string,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(tenantDomains)
    .where(
      and(
        eq(tenantDomains.tenantId, tenantId),
        eq(tenantDomains.domain, domain),
      ),
    )
    .returning({ domain: tenantDomains.domain });

  return deleted.length > 0;
}
