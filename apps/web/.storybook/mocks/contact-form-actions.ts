import { ACTION_OUTCOME } from '@blog/config';
import type {
  TContactMessageInput,
  TSubmitContactResult,
} from '@web/server/contact-form/contact-form-actions/contact-form-actions';

/** Answers `server-error` for a message containing `fail`, `sent` otherwise. */
export const submitContactMessage = async ({
  message,
}: TContactMessageInput): Promise<TSubmitContactResult> => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return message.includes('fail')
    ? { outcome: ACTION_OUTCOME.SERVER_ERROR }
    : { outcome: ACTION_OUTCOME.SUCCESS };
};
