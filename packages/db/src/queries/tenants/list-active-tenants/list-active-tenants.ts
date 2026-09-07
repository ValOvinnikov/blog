import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Lists tenants with `status` ACTIVE that have never been deprovisioned.
 */
export async function listActiveTenants(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.status, TENANT_STATUS.ACTIVE),
        isNull(tenants.deprovisionedAt),
      ),
    );
}
