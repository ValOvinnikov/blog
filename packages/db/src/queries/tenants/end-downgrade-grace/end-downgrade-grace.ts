import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { TENANT_PLAN } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

// Returns the tenant only to the one caller that ended a grace still running on Free.
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
        eq(tenants.plan, TENANT_PLAN.FREE),
        eq(tenants.downgradeGraceStartedAt, graceStartedAt),
      ),
    )
    .returning();

  return ended ?? null;
}
