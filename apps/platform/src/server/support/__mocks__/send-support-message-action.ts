import type { TSendSupportMessageResult } from '@platform/server/support/send-support-message-action';
import type { TSendSupportMessageInput } from '@platform/server/support/support-message-input';
import { ACTION_OUTCOME } from '@shinefold/config';

export const sendSupportMessageAction = vi.fn<
  (
    tenantId: string,
    input: TSendSupportMessageInput,
  ) => Promise<TSendSupportMessageResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
