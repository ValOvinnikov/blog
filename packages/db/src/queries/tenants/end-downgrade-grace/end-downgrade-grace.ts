import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { hasLength } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function endDowngradeGrace(
  tenantId: string,
  graceStartedAt: Date,
): Promise<boolean> {
  const ended = await getDb()
    .update(tenants)
    .set({
      downgradeGraceStartedAt: null,
      graceStartedEmailSentAt: null,
      graceHalfwayEmailSentAt: null,
      graceEndingEmailSentAt: null,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.downgradeGraceStartedAt, graceStartedAt),
      ),
    )
    .returning({ id: tenants.id });

  return hasLength(ended);
}
