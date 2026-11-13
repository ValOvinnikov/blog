import { getDb } from '@blog/db/client';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { hasLength } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function renameTenantDomain(
  tenantId: string,
  from: string,
  to: string,
): Promise<boolean> {
  const renamed = await getDb()
    .update(tenantDomains)
    .set({ domain: to })
    .where(
      and(eq(tenantDomains.tenantId, tenantId), eq(tenantDomains.domain, from)),
    )
    .returning({ id: tenantDomains.id });

  return hasLength(renamed);
}
