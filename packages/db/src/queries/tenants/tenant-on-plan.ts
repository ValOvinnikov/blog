import { getDb } from '@blog/db/client';
import type { TTenantPlan } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, exists, type SQL } from 'drizzle-orm';

export function isTenantOnPlan(tenantId: string, plan: TTenantPlan): SQL {
  return exists(
    getDb()
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), eq(tenants.plan, plan))),
  );
}
