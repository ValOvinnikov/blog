import { getDb } from '@shinefold/db/client';
import { WRITABLE_TENANT_STATUSES } from '@shinefold/db/constants';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { and, inArray, isNull } from 'drizzle-orm';

export async function listActiveTenants(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        inArray(tenants.status, WRITABLE_TENANT_STATUSES),
        isNull(tenants.deprovisionedAt),
      ),
    );
}
