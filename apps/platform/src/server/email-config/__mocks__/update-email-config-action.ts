import { ACTION_OUTCOME } from '@blog/config';
import type { updateEmailConfigAction as TUpdateEmailConfigAction } from '@platform/server/email-config/update-email-config-action';

export const updateEmailConfigAction = vi.fn<typeof TUpdateEmailConfigAction>(
  async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
);
