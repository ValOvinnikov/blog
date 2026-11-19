import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import {
  enqueueOwnerAccessRequest,
  type TOwnerAccessRequestResult,
} from '@platform/server/owner-access/request-owner-access';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';

/** Resolves `undefined` when the tenant has no Sanity project, so no Studio invite was due. */
export const reinviteChangedOwner = async (
  tenant: TTenant,
  ownerEmail: string,
  formerOwnerEmail: string,
): Promise<TMaybeUndefined<TOwnerAccessRequestResult>> => {
  await sendOwnerInviteEmail(tenant.id, ownerEmail);
  if (!tenant.sanityProjectId) return undefined;
  return enqueueOwnerAccessRequest(OWNER_INVITE_RESEND_PATH, tenant.id, {
    formerOwnerEmail,
  });
};
