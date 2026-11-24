import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

// Returns the tenant only to the one caller that ended a grace no plan change has cleared or restarted since it was read.
export async function endDowngradeGrace(
  tenantId: string,
  graceStartedAt: Date,
): Promise<TMaybeNull<TTenant>> {
  const [ended] = await getDb()
    .update(tenants)
    .set({
      downgradeGraceStartedAt: null,
      graceStartedEmailSentAt: null,
      graceHalfwayEmailSentAt: null,
      graceEndingEmailSentAt: null,
      downgradedFromPlan: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.downgradeGraceStartedAt, graceStartedAt),
      ),
    )
    .returning();

  return ended ?? null;
}
