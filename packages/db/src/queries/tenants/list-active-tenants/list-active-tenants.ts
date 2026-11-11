import { getDb } from '@blog/db/client';
import { SERVED_TENANT_STATUSES } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, inArray, isNull } from 'drizzle-orm';

export async function listActiveTenants(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        inArray(tenants.status, SERVED_TENANT_STATUSES),
        isNull(tenants.deprovisionedAt),
      ),
    );
}
