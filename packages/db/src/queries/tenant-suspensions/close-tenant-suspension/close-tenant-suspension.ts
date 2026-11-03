import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import {
  tenantSuspensions,
  type TTenantSuspension,
} from '@blog/db/schema/tenant-suspensions';
import { and, eq, isNull } from 'drizzle-orm';

export async function closeTenantSuspension(
  tenantId: string,
  liftedBy: string,
): Promise<TMaybeUndefined<TTenantSuspension>> {
  const [suspension] = await getDb()
    .update(tenantSuspensions)
    .set({ liftedAt: new Date(), liftedBy })
    .where(
      and(
        eq(tenantSuspensions.tenantId, tenantId),
        isNull(tenantSuspensions.liftedAt),
      ),
    )
    .returning();

  return suspension;
}
