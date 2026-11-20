import type { TOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import {
  buildOwnerLimitEmail,
  type TOwnerLimitEmailInput,
} from '@shinefold/email/templates/owner/owner-limit-email/owner-limit-email';

export type TOwnerNewsletterPausedEmailInput = TOwnerLimitEmailInput;

export function buildOwnerNewsletterPausedEmail(
  input: TOwnerNewsletterPausedEmailInput,
): TOwnerEmail {
  return buildOwnerLimitEmail(input);
}
