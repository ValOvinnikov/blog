import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

// Marks a tenant deprovisioned by stamping `deprovisionedAt` and setting
// `status` to ARCHIVED — the row is archived, never hard-deleted, so
// `slug`'s unique constraint keeps holding the name even after teardown.
// `tenantId` not matching any row (a stale id, or a second concurrent
// deprovision attempt) is a real, reachable outcome, not a bug.
export async function archiveTenant(
  tenantId: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const [tenant] = await db
    .update(tenants)
    .set({ deprovisionedAt: new Date(), status: TENANT_STATUS.ARCHIVED })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
