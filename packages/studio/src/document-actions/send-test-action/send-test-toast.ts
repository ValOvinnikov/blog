import type { ToastParams } from '@sanity/ui/toast';
import {
  isOutcomeSuccess,
  NEWSLETTER_TEST_SEND_REFUSAL,
  type TNewsletterTestSendResult,
} from '@shinefold/config';
import { formatSendTime } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-format';

export const SEND_TEST_FAILED_TOAST: ToastParams = {
  status: 'error',
  title: "The test couldn't be sent. Try again in a minute.",
};

export const toSendTestToast = (
  result: TNewsletterTestSendResult,
  email: string,
): ToastParams => {
  if (isOutcomeSuccess(result)) {
    return {
      status: 'success',
      title: `Test sent to ${email} — only you got it.`,
    };
  }
  if (result.reason === NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED) {
    return {
      status: 'warning',
      title: `You've sent the most tests for now. Try again at ${formatSendTime(result.retryAt)}.`,
    };
  }
  return SEND_TEST_FAILED_TOAST;
};
