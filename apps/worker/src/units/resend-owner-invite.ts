import {
  findOwner,
  loadOwnerAccessTarget,
} from '@worker/utils/owner-access/owner-access-target';
import { sendOwnerInvite } from '@worker/utils/owner-access/owner-invite';

export async function resendOwnerInvite(tenantId: string): Promise<void> {
  const target = await loadOwnerAccessTarget(tenantId);
  const owner = await findOwner(target);
  if (!owner) await sendOwnerInvite(target, { replaceExisting: true });
}
