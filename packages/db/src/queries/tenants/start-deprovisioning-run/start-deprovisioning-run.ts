import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  tenants,
  type TDeprovisioningRun,
  type TTenant,
} from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TStartDeprovisioningRunInput = {
  tenantId: string;
  workflowRunUrl?: string;
};

// Replaces the `deprovisioningSteps.run` key wholesale (never merges) so a
// re-run resets its own start time rather than carrying over a stale one
// from the run it's retrying.
export async function startDeprovisioningRun(
  input: TStartDeprovisioningRunInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const run: TDeprovisioningRun = {
    startedAt: new Date().toISOString(),
    ...(input.workflowRunUrl === undefined
      ? {}
      : { workflowRunUrl: input.workflowRunUrl }),
  };

  const [tenant] = await db
    .update(tenants)
    .set({
      deprovisioningSteps: sql`jsonb_set(
        coalesce(${tenants.deprovisioningSteps}, '{}'::jsonb),
        array['run']::text[],
        ${JSON.stringify(run)}::jsonb,
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
