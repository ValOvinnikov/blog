import type { TTenant } from '@blog/db/schema/tenants';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';

export const reinviteChangedOwner = async (
  tenant: TTenant,
  ownerEmail: string,
): Promise<void> => {
  await sendOwnerInviteEmail(tenant.id, ownerEmail);
  if (tenant.sanityProjectId) {
    await enqueueOwnerAccessRequest(OWNER_INVITE_RESEND_PATH, tenant.id);
  }
};
