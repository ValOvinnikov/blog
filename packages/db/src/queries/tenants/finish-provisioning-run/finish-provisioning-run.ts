import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TFinishProvisioningRunInput = {
  tenantId: string;
};

// Merges `finishedAt` into whatever `provisioningSteps.run` already holds,
// so it can never clobber `startedAt`/`registry`/`workflowRunUrl` — recorded
// for a failed run too, since that timeline is the whole diagnostic value.
export async function finishProvisioningRun(
  input: TFinishProvisioningRunInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const patch = { finishedAt: new Date().toISOString() };

  const [tenant] = await db
    .update(tenants)
    .set({
      provisioningSteps: sql`jsonb_set(
        coalesce(${tenants.provisioningSteps}, '{}'::jsonb),
        array['run']::text[],
        coalesce(${tenants.provisioningSteps}->'run', '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb,
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
