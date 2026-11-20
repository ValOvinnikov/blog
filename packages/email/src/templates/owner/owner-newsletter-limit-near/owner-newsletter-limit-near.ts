import type { TOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import {
  buildOwnerLimitEmail,
  type TOwnerLimitEmailInput,
} from '@shinefold/email/templates/owner/owner-limit-email/owner-limit-email';

export type TOwnerNewsletterLimitNearEmailInput = TOwnerLimitEmailInput;

export function buildOwnerNewsletterLimitNearEmail(
  input: TOwnerNewsletterLimitNearEmailInput,
): TOwnerEmail {
  return buildOwnerLimitEmail(input);
}
