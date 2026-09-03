import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
} from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

function isFailedStepState(value: unknown): value is TProvisioningStepState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    value.status === TENANT_PROVISIONING_STEP_STATUS.FAILED
  );
}

function hasFailedStep(tenant: TTenant): boolean {
  const steps = tenant.provisioningSteps;
  if (!steps) return false;

  return Object.values(steps).some(isFailedStepState);
}

/**
 * Tenants stuck at `provisioningStatus: PROVISIONING` despite one of their
 * steps recording FAILED — a state `beginTenantProvisioning`'s retry guard
 * cannot get a wedged row out of on its own, since the guard only admits a
 * row that is NULL or not PROVISIONING.
 */
export async function listTenantsWedgedInProvisioning(): Promise<TTenant[]> {
  const db = getDb();

  const provisioning = await db
    .select()
    .from(tenants)
    .where(
      eq(tenants.provisioningStatus, TENANT_PROVISIONING_STATUS.PROVISIONING),
    );

  return provisioning.filter(hasFailedStep);
}
