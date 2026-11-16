import { type TTenantPlan } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, eq, exists, type SQL } from 'drizzle-orm';

export function isTenantOnPlan(tenantId: string, plan: TTenantPlan): SQL {
  return exists(
    getDb()
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.plan, plan))),
  );
}
