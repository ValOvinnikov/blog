import { SANITY_PROJECT_ROLE } from '@shinefold/config';
import { TENANT_OWNER_EMAIL } from '@shinefold/db/constants';
import { setTenantOwnerAccess } from '@shinefold/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
  type TSanityInvite,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import { sanitizeLogMessage } from '@shinefold/insight';
import {
  OWNER_ACCESS_LOG,
  SANITY_PENDING_INVITE_STATUS,
} from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
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

async function deleteInvites(
  target: TOwnerAccessTarget,
  invites: TSanityInvite[],
): Promise<void> {
  const { projectId, token } = target;
  for (const { id } of invites) {
    if (id) await deleteSanityProjectInvite({ token, projectId, inviteId: id });
  }
}

async function deleteOwnerInvites(target: TOwnerAccessTarget): Promise<void> {
  const { tenant } = target;

  const invites = await listOwnerInvites(target);
  await deleteInvites(target, invites);

  const isRecordedInviteDeleted = invites.some(
    ({ id }) => !!id && id === tenant.ownerSanityInviteId,
  );
  if (!isRecordedInviteDeleted) return;

  const cleared = await setTenantOwnerAccess(tenant.id, {
    sanityInviteId: null,
  });
  if (!cleared.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s deleted owner invite could not be cleared (${cleared.error}).`,
    );
  }
}

export async function deleteOwnerInvitesAfterGrant(
  target: TOwnerAccessTarget,
): Promise<void> {
  try {
    await deleteOwnerInvites(target);
  } catch (error) {
    logger.error(OWNER_ACCESS_LOG.INVITE_DELETE_FAILED, {
      tenantId: target.tenant.id,
      error: sanitizeLogMessage(error),
    });
  }
}

export async function sendOwnerInvite(
  target: TOwnerAccessTarget,
  options: { replaceExisting: boolean },
): Promise<Date> {
  const { tenant, projectId, ownerEmail, token } = target;

  const existing = await listOwnerInvites(target);
  if (options.replaceExisting) await deleteInvites(target, existing);

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
