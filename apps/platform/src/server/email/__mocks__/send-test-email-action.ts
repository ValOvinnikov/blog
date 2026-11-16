import type {
  TSendTestEmailInput,
  TSendTestEmailResult,
} from '@platform/server/email/send-test-email-action';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';

export const sendTestEmailAction = vi.fn<
  (
    tenantId: string,
    input: TSendTestEmailInput,
  ) => Promise<TSendTestEmailResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS, to: MOCK_ADMIN_EMAIL }));
