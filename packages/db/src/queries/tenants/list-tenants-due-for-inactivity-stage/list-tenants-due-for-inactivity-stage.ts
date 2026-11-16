import { getDb } from '@shinefold/db/client';
import type { TInactivityStage } from '@shinefold/db/constants';
import { inactivityStageDue } from '@shinefold/db/queries/tenants/inactivity-stage-due';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';

export async function listTenantsDueForInactivityStage(
  stage: TInactivityStage,
  now: Date,
): Promise<TTenant[]> {
  return getDb().select().from(tenants).where(inactivityStageDue(stage, now));
}
