import type { updateEmailConfigAction as TUpdateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const updateEmailConfigAction = vi.fn<typeof TUpdateEmailConfigAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
);
