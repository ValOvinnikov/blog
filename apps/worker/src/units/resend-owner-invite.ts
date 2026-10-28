import {
  findOwner,
  loadOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import { sendOwnerInvite } from '@worker/utils/owner-access/owner-invite';
import { revokeFormerOwnerAccess } from '@worker/utils/owner-access/revoke-former-owner-access';

export async function resendOwnerInvite(
  tenantId: string,
  formerOwnerEmail?: string,
): Promise<void> {
  const target = await loadOwnerAccessTarget(tenantId);
  await revokeFormerOwnerAccess(target, formerOwnerEmail);
  const owner = await findOwner(target);
  if (!owner) await sendOwnerInvite(target, { replaceExisting: true });
}
