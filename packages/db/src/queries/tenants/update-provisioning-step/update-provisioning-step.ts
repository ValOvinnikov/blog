import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  type TElevateTenantOwnerOutcome,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
  type TWorkerProvisioningStep,
} from '@blog/db/constants';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
} from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TUpdateProvisioningStepInput = {
  tenantId: string;
  step: TTenantProvisioningStep | TWorkerProvisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
  detail?: TElevateTenantOwnerOutcome;
  failingSince?: string;
  provisioningStatus?: TTenantProvisioningStatus;
  notifiedOwnerElevationOutcome?: TElevateTenantOwnerOutcome;
};

// `jsonb_set` writes the one key in Postgres, so two steps reporting at once never clobber each other's entry.
export async function updateProvisioningStep(
  input: TUpdateProvisioningStepInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const stepState: TProvisioningStepState = {
    status: input.status,
    ...(input.error === undefined ? {} : { error: input.error }),
    ...(input.detail === undefined ? {} : { detail: input.detail }),
    ...(input.failingSince === undefined
      ? {}
      : { failingSince: input.failingSince }),
    updatedAt: new Date().toISOString(),
  };

  const [tenant] = await db
    .update(tenants)
    .set({
      provisioningSteps: sql`jsonb_set(
        coalesce(${tenants.provisioningSteps}, '{}'::jsonb),
        array[${input.step}]::text[],
        ${JSON.stringify(stepState)}::jsonb,
        true
      )`,
      ...(input.provisioningStatus === undefined
        ? {}
        : { provisioningStatus: input.provisioningStatus }),
      ...(input.notifiedOwnerElevationOutcome === undefined
        ? {}
        : {
            lastNotifiedOwnerElevationOutcome:
              input.notifiedOwnerElevationOutcome,
          }),
    })
    .where(eq(tenants.id, input.tenantId))
    .returning();

  if (!tenant) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tenant);
}
