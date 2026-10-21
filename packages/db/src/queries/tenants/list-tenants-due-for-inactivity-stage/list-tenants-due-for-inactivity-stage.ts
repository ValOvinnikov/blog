import { getDb } from '@blog/db/client';
import type { TInactivityStage } from '@blog/db/constants';
import { inactivityStageDue } from '@blog/db/queries/tenants/inactivity-stage-due';
import { tenants, type TTenant } from '@blog/db/schema/tenants';

export async function listTenantsDueForInactivityStage(
  stage: TInactivityStage,
  now: Date,
): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(inactivityStageDue(stage, now));
}
