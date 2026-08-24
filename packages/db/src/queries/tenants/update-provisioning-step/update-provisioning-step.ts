import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export type TUpdateProvisioningStepInput = {
  tenantId: string;
  step: TTenantProvisioningStep;
  status: TTenantProvisioningStepStatus;
  // Only meaningful (and only ever set) alongside `status: FAILED`. No
  // faked default — omitted entirely rather than stored as `''` when there
  // is no error.
  error?: string;
  // Set only on the workflow's last step (success or failure) — every
  // earlier step's call omits this and leaves the tenant's overall
  // `provisioningStatus` untouched.
  provisioningStatus?: TTenantProvisioningStatus;
};

// Updates exactly one key of the `provisioningSteps` jsonb map via
// Postgres's `jsonb_set`, never a JS-level read-modify-write of the whole
// object — so two steps reporting status back around the same time can
// never race each other into clobbering one another's entry. `error` is
// written only when supplied, matching `TProvisioningStepState`'s optional
// field; the overall `provisioningStatus` column is left untouched unless
// this call explicitly supplies one.
//
// `tenantId` not matching any row is a real, reachable outcome — the CI
// provisioning script (`packages/db/scripts/provision-tenant/`) passes a
// `--tenant-id` it does not itself validate.
export async function updateProvisioningStep(
  input: TUpdateProvisioningStepInput,
): Promise<TResult<TTenant, TErrorCode>> {
  const db = getDb();

  const stepState: { status: TTenantProvisioningStepStatus; error?: string } =
    input.error === undefined
      ? { status: input.status }
      : { status: input.status, error: input.error };

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
    })
    .where(eq(tenants.id, input.tenantId))
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: tenant };
}
