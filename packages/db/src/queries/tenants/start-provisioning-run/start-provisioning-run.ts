import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  tenants,
  type TProvisioningRun,
  type TTenant,
} from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TStartProvisioningRunInput = {
  tenantId: string;
  registry?: string;
  workflowRunUrl?: string;
};

// Replaces the `provisioningSteps.run` key wholesale (never merges) so a
// re-run resets its own start time rather than carrying over a stale one
// from the run it's retrying.
export async function startProvisioningRun(
  input: TStartProvisioningRunInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const run: TProvisioningRun = {
    startedAt: new Date().toISOString(),
    ...(input.registry === undefined ? {} : { registry: input.registry }),
    ...(input.workflowRunUrl === undefined
      ? {}
      : { workflowRunUrl: input.workflowRunUrl }),
  };

  const [tenant] = await db
    .update(tenants)
    .set({
      provisioningSteps: sql`jsonb_set(
        coalesce(${tenants.provisioningSteps}, '{}'::jsonb),
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
