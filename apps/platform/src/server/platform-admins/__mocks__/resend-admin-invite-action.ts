import type { TPlatformAdminRefusal } from '@platform/constants/platform-admins';
import type { TRefusalResult } from '@platform/utils/refused-action/refused-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const resendAdminInviteAction = vi.fn<
  (id: string) => Promise<TRefusalResult<TPlatformAdminRefusal>>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
