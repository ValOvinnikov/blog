import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import {
  tenants,
  type TDeprovisioningStepState,
  type TTenant,
} from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TUpdateDeprovisioningStepInput = {
  tenantId: string;
  step: TDeprovisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
};

// Updates exactly one key of the `deprovisioningSteps` jsonb map via
// Postgres's `jsonb_set`, never a JS-level read-modify-write of the whole
// object, mirroring `updateProvisioningStep`.
export async function updateDeprovisioningStep(
  input: TUpdateDeprovisioningStepInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const stepState: TDeprovisioningStepState = {
    status: input.status,
    ...(input.error === undefined ? {} : { error: input.error }),
    updatedAt: new Date().toISOString(),
  };

  const [tenant] = await db
    .update(tenants)
    .set({
      deprovisioningSteps: sql`jsonb_set(
        coalesce(${tenants.deprovisioningSteps}, '{}'::jsonb),
        array[${input.step}]::text[],
        ${JSON.stringify(stepState)}::jsonb,
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
