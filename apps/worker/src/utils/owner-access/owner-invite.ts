import { SANITY_PROJECT_ROLE } from '@blog/config';
import { setTenantOwnerAccess } from '@blog/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
  type TSanityInvite,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';

import { hasOwnerEmail, type TOwnerAccessTarget } from './owner-access-target';

async function listOwnerInvites(
  target: TOwnerAccessTarget,
): Promise<TSanityInvite[]> {
  const invites = await listSanityProjectInvites({
    token: target.env.sanityManagementToken,
    projectId: target.projectId,
  });
  return invites.filter(
    ({ email, status }) =>
      status === SANITY_PENDING_INVITE_STATUS && hasOwnerEmail(target, email),
  );
}

export async function sendOwnerInvite(
  target: TOwnerAccessTarget,
  options: { replaceExisting: boolean },
): Promise<void> {
  const { tenant, projectId, ownerEmail, env } = target;
  const token = env.sanityManagementToken;

  const existing = await listOwnerInvites(target);
  if (options.replaceExisting) {
    for (const { id } of existing) {
      if (id)
        await deleteSanityProjectInvite({ token, projectId, inviteId: id });
    }
  }

  let [invite] = options.replaceExisting ? [] : existing;
  if (!invite) {
    // The invites endpoint rejects `administrator` with a 403.
    await createSanityProjectInvite({
      token,
      projectId,
      email: ownerEmail,
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
    [invite] = await listOwnerInvites(target);
  }

  const recorded = await setTenantOwnerAccess(tenant.id, {
    sanityInviteId: invite?.id ?? null,
    inviteSentAt: invite?.createdAt ? new Date(invite.createdAt) : new Date(),
    inviteAcceptedAt: null,
  });
  if (!recorded.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner invite could not be recorded (${recorded.error}).`,
    );
  }
}
