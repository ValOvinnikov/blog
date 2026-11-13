import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  INACTIVITY_STAGE,
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TStampedInactivityStage,
} from '@blog/db/constants';
import { heldStatusFields } from '@blog/db/queries/tenants/held-status-fields';
import { inactivityStageDue } from '@blog/db/queries/tenants/inactivity-stage-due';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';

const stageStamp: Record<
  TStampedInactivityStage,
  (now: Date) => PgUpdateSetSource<typeof tenants>
> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: (now) => ({ inactivityWarnedAt: now }),
  [INACTIVITY_STAGE.SUSPENSION]: (now) => ({
    ...heldStatusFields(),
    suspendedAt: now,
    status: TENANT_STATUS.SUSPENDED,
    suspensionReason: SUSPENSION_REASON.INACTIVITY,
  }),
  [INACTIVITY_STAGE.DELETION_NOTICE]: (now) => ({ deletionNotifiedAt: now }),
};

// Returns the tenant only to the one caller that moved it into the stage.
export async function stampTenantInactivityStage(
  tenantId: string,
  stage: TStampedInactivityStage,
  now: Date,
): Promise<TMaybeNull<TTenant>> {
  const [stamped] = await getDb()
    .update(tenants)
    .set(stageStamp[stage](now))
    .where(and(eq(tenants.id, tenantId), inactivityStageDue(stage, now)))
    .returning();

  return stamped ?? null;
}
