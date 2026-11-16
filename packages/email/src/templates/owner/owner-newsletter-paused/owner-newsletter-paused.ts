import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TOwnerNewsletterPausedEmailInput = TOwnerEmailInput & {
  action: TEmailAction;
};

export function buildOwnerNewsletterPausedEmail(
  input: TOwnerNewsletterPausedEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
