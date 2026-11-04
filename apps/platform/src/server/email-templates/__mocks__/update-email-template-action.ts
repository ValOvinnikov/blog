import { ACTION_OUTCOME } from '@blog/config';
import type { updateEmailTemplateAction as TUpdateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import { mockEmailTemplateResult } from '@platform/testing/email/fixtures';

export const updateEmailTemplateAction = vi.fn<
  typeof TUpdateEmailTemplateAction
>(async () => ({
  outcome: ACTION_OUTCOME.SUCCESS,
  result: mockEmailTemplateResult(),
}));
