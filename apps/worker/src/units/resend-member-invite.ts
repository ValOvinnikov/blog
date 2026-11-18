import { loadMemberAccessTarget } from '@worker/utils/member-access/member-access-target';
import { sendMemberInvite } from '@worker/utils/member-access/member-invite';
import { findStudioUser } from '@worker/utils/studio-access/find-studio-user';

export async function resendMemberInvite(
  tenantId: string,
  membershipId: string,
): Promise<void> {
  const target = await loadMemberAccessTarget(tenantId, membershipId);
  if (!target) return;
  const user = await findStudioUser(target, target.email);
  if (!user) await sendMemberInvite(target, { replaceExisting: true });
}
