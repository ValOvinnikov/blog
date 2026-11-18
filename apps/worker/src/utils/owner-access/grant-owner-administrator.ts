import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  SANITY_PROJECT_ROLE as STORED_SANITY_PROJECT_ROLE,
  type TElevateTenantOwnerOutcome,
} from '@shinefold/db/constants';
import {
  setTenantOwnerAccess,
  touchTenantActivity,
} from '@shinefold/db/queries/tenants';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
import { grantAdministrator } from '@worker/utils/studio-access/grant-administrator';
import { toLoginProvider } from '@worker/utils/studio-access/login-provider';

import { resolveOwnerAccessFinding } from './owner-access-finding';
import type { TOwnerAccessTarget } from './owner-access-target';

async function touchActivityOnInviteAcceptance(
  tenantId: string,
  acceptedAt: Date,
): Promise<void> {
  const touched = await touchTenantActivity(tenantId, acceptedAt);
  if (!touched.ok) {
    logger.error(OWNER_ACCESS_LOG.ACTIVITY_TOUCH_FAILED, {
      tenantId,
      error: touched.error,
    });
  }
}

export async function grantOwnerAdministrator(
  target: TOwnerAccessTarget,
  owner: TSanityUser,
): Promise<TElevateTenantOwnerOutcome> {
  const { tenant } = target;

  const hasChanged = await grantAdministrator(target, owner);
  // Before recording administrator: a granted tenant leaves the sweep, so a finding still open then never clears.
  await resolveOwnerAccessFinding(tenant.id);

  const inviteAcceptedAt = tenant.ownerInviteAcceptedAt ?? new Date();
  const recorded = await setTenantOwnerAccess(tenant.id, {
    inviteAcceptedAt,
    sanityUserId: owner.sanityUserId,
    loginProvider: toLoginProvider(owner.profile.provider),
    sanityRole: STORED_SANITY_PROJECT_ROLE.ADMINISTRATOR,
  });
  if (!recorded.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner access could not be recorded (${recorded.error}).`,
    );
  }

  if (!tenant.ownerInviteAcceptedAt) {
    await touchActivityOnInviteAcceptance(tenant.id, inviteAcceptedAt);
  }

  return hasChanged
    ? ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED
    : ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR;
}
