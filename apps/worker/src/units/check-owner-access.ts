import type { TElevateTenantOwnerOutcome } from '@blog/db/constants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { grantOwnerAdministrator } from '@worker/utils/owner-access/grant-owner-administrator';
import {
  findOwner,
  loadOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import {
  pendingOwnerAccessOutcome,
  reportOwnerAccessOutcome,
} from '@worker/utils/owner-access/report-owner-access-outcome';

export async function checkOwnerAccess(
  tenantId: string,
): Promise<TElevateTenantOwnerOutcome> {
  'use step';

  const target = await loadOwnerAccessTarget(tenantId);
  const owner = await findOwner(target);
  const outcome = owner
    ? await grantOwnerAdministrator(target, owner)
    : pendingOwnerAccessOutcome(target.tenant);

  await reportOwnerAccessOutcome(target.tenant, outcome);
  return outcome;
}

checkOwnerAccess.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
