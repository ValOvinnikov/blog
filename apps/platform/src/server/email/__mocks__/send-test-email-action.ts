import { ACTION_OUTCOME } from '@blog/config';
import type {
  TSendTestEmailInput,
  TSendTestEmailResult,
} from '@platform/server/email/send-test-email-action';
import { MOCK_ADMIN_EMAIL } from '@platform/testing/admins/fixtures';

export const sendTestEmailAction = vi.fn<
  (
    tenantId: string,
    input: TSendTestEmailInput,
  ) => Promise<TSendTestEmailResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS, to: MOCK_ADMIN_EMAIL }));
