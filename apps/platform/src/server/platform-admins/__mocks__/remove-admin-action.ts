import type { TPlatformAdminRefusalResult } from '@platform/server/platform-admins/platform-admin-refusal';
import { ACTION_OUTCOME } from '@shinefold/config';

export const removeAdminAction = vi.fn<
  (id: string) => Promise<TPlatformAdminRefusalResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
