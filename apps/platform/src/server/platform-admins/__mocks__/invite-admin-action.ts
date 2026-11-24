import type { TAdminInviteInput } from '@platform/server/platform-admins/admin-invite-input';
import type { TInviteAdminResult } from '@platform/server/platform-admins/invite-admin-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const inviteAdminAction = vi.fn<
  (input: TAdminInviteInput) => Promise<TInviteAdminResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
