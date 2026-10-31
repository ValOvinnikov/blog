import { SANITY_PROJECT_ROLE } from '@blog/config';
import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import { setTenantOwnerAccess } from '@blog/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
  type TSanityInvite,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';

import { hasOwnerEmail, type TOwnerAccessTarget } from './owner-access-target';

async function listOwnerInvites(
  target: TOwnerAccessTarget,
): Promise<TSanityInvite[]> {
  const invites = await listSanityProjectInvites({
    token: target.token,
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
): Promise<Date> {
  const { tenant, projectId, ownerEmail, token } = target;

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

  const inviteSentAt = invite?.createdAt
    ? new Date(invite.createdAt)
    : new Date();
  const recorded = await setTenantOwnerAccess(tenant.id, {
    sanityInviteId: invite?.id ?? null,
    inviteSentAt,
    inviteAcceptedAt: null,
    ...(options.replaceExisting && {
      inviteHeadsUpSentAt: null,
      inviteNudgeSentAt: null,
    }),
  });
  if (!recorded.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s owner invite could not be recorded (${recorded.error}).`,
    );
  }
  await sendOwnerEmailOnce(target, TENANT_OWNER_EMAIL.INVITE_HEADS_UP);
  return inviteSentAt;
}
