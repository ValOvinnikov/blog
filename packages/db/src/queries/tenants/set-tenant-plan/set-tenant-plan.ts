import { getDb } from '@blog/db/client';
import {
  ROW_LOCK,
  TENANT_PLAN_WRITE_OUTCOME,
  type TTenantPlan,
  type TTenantStatus,
  WRITABLE_TENANT_STATUSES,
} from '@blog/db/constants';
import { planChangeFields } from '@blog/db/queries/tenants/plan-change-fields';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, inArray } from 'drizzle-orm';

export type TTenantPlanAndStatus = {
  plan: TTenantPlan;
  status: TTenantStatus;
};

export type TTenantPlanWrite =
  | ({
      outcome: typeof TENANT_PLAN_WRITE_OUTCOME.WRITTEN;
      previousPlan: TTenantPlan;
    } & TTenantPlanAndStatus)
  | {
      outcome: typeof TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE;
      status: TTenantStatus;
    }
  | { outcome: typeof TENANT_PLAN_WRITE_OUTCOME.NOT_FOUND };

export async function setTenantPlan(
  tenantId: string,
  { plan, status }: TTenantPlanAndStatus,
): Promise<TTenantPlanWrite> {
  const db = getDb();
  const previous = db
    .$with('previous')
    .as(
      db
        .select({ previousId: tenants.id, previousPlan: tenants.plan })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .for(ROW_LOCK.UPDATE),
    );
  const [row] = await db
    .with(previous)
    .update(tenants)
    .set({ ...planChangeFields(plan, status, new Date()), status })
    .from(previous)
    .where(
      and(
        eq(tenants.id, previous.previousId),
        inArray(tenants.status, WRITABLE_TENANT_STATUSES),
      ),
    )
    .returning({
      plan: tenants.plan,
      status: tenants.status,
      previousPlan: previous.previousPlan,
    });

  if (row) {
    return { outcome: TENANT_PLAN_WRITE_OUTCOME.WRITTEN, ...row };
  }

  const [existing] = await db
    .select({ status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return existing
    ? { outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_WRITABLE, ...existing }
    : { outcome: TENANT_PLAN_WRITE_OUTCOME.NOT_FOUND };
}
