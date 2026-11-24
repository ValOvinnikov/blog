import type { TPlatformAdminRefusal } from '@platform/constants/platform-admins';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';

export type TPlatformAdminRefusalResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TPlatformAdminRefusal
>;

export const refusedPlatformAdminAction = (
  reason: TPlatformAdminRefusal,
): TPlatformAdminRefusalResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});
