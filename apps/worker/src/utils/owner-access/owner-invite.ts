import { TENANT_OWNER_EMAIL } from '@shinefold/db/constants';
import { setTenantOwnerAccess } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { logger } from '@worker/utils/logger/logger';
import { sendOwnerEmailOnce } from '@worker/utils/owner-email/send-owner-email';
import {
  deleteInvites,
  ensureViewerInvite,
  listPendingInvites,
} from '@worker/utils/studio-access/studio-invites';

import type { TOwnerAccessTarget } from './owner-access-target';

async function deleteOwnerInvites(target: TOwnerAccessTarget): Promise<void> {
  const { tenant } = target;

  const invites = await listPendingInvites(target, target.ownerEmail);
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
  const { tenant, ownerEmail } = target;

  const { inviteId, inviteSentAt } = await ensureViewerInvite(
    target,
    ownerEmail,
    options,
  );
  const recorded = await setTenantOwnerAccess(tenant.id, {
    sanityInviteId: inviteId,
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
