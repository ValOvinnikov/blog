import { getDb } from '@blog/db/client';
import {
  tenantDomains,
  type TTenantDomain,
} from '@blog/db/schema/tenant-domains';
import { eq } from 'drizzle-orm';

export async function listTenantDomains(
  tenantId: string,
): Promise<TTenantDomain[]> {
  const db = getDb();

  return db
    .select()
    .from(tenantDomains)
    .where(eq(tenantDomains.tenantId, tenantId));
}
