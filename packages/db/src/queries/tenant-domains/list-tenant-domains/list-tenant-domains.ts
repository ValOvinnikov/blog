import { getDb } from '@shinefold/db/client';
import {
  tenantDomains,
  type TTenantDomain,
} from '@shinefold/db/schema/tenant-domains';
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
