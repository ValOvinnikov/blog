import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { updateProvisioningStep } from '@blog/db/queries/tenants';

/**
 * Persists one `elevateTenantOwner` check's outcome to the tenant's
 * `OWNER_ELEVATION` provisioning step, always as DONE: every outcome is a
 * completed check, and only `detail` distinguishes them.
 */
export async function reportOwnerElevationOutcome(
  tenantId: string,
  outcome: TElevateTenantOwnerOutcome,
  notifiedOutcome?: TElevateTenantOwnerOutcome,
): Promise<void> {
  const step = TENANT_PROVISIONING_STEP.OWNER_ELEVATION;
  const result = await updateProvisioningStep({
    tenantId,
    step,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: outcome,
    notifiedOwnerElevationOutcome: notifiedOutcome,
  });

  if (!result.ok) {
    console.error(
      `recheck-tenant-owners: failed to record "${step}" for tenant "${tenantId}" (${result.error}).`,
    );
  }
}
