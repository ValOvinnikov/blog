import type { TMaybeNull } from '@shinefold/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@shinefold/db/constants';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { grantAdministrator } from '@worker/utils/studio-access/grant-administrator';
import { toLoginProvider } from '@worker/utils/studio-access/login-provider';
import { revokeProjectRoles } from '@worker/utils/studio-access/revoke-project-roles';

import { recordMemberAccess } from './member-access-record';
import type { TMemberAccessTarget } from './member-access-target';
import { deleteMemberInvitesAfterGrant } from './member-invite';

function isGrantRecorded(
  target: TMemberAccessTarget,
  user: TSanityUser,
): boolean {
  const { inviteAcceptedAt, sanityUserId } = target.access;
  return !!inviteAcceptedAt && sanityUserId === user.sanityUserId;
}

// Resolves null when the membership was removed meanwhile, revoking the role again; an empty patch only confirms the row still exists.
export async function grantMemberAdministrator(
  target: TMemberAccessTarget,
  user: TSanityUser,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  const hasChanged = await grantAdministrator(target, user);
  await deleteMemberInvitesAfterGrant(target);

  const { inviteSentAt, inviteAcceptedAt } = target.access;
  const acceptedAt = inviteAcceptedAt ?? new Date();
  const isRecorded = await recordMemberAccess(
    target,
    isGrantRecorded(target, user)
      ? {}
      : {
          sanityInviteId: null,
          inviteSentAt: inviteSentAt ?? acceptedAt,
          inviteAcceptedAt: acceptedAt,
          sanityUserId: user.sanityUserId,
          loginProvider: toLoginProvider(user.profile.provider),
        },
  );
  if (!isRecorded) {
    await revokeProjectRoles(target, [user]);
    return null;
  }

  return hasChanged
    ? ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED
    : ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR;
}
