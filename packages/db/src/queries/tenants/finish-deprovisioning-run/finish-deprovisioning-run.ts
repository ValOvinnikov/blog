import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TFinishDeprovisioningRunInput = {
  tenantId: string;
};

// Merges `finishedAt` into whatever `deprovisioningSteps.run` already holds,
// so it can never clobber `startedAt`/`workflowRunUrl` — recorded for a
// failed run too, since that timeline is the whole diagnostic value.
export async function finishDeprovisioningRun(
  input: TFinishDeprovisioningRunInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const patch = { finishedAt: new Date().toISOString() };

  const [tenant] = await db
    .update(tenants)
    .set({
      deprovisioningSteps: sql`jsonb_set(
        coalesce(${tenants.deprovisioningSteps}, '{}'::jsonb),
        array['run']::text[],
        coalesce(${tenants.deprovisioningSteps}->'run', '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb,
        true
      )`,
    })
    .where(eq(tenants.id, input.tenantId))
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
