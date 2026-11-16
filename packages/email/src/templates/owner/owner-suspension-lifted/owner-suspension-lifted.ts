import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TOwnerSuspensionLiftedEmailInput = TOwnerEmailInput & {
  action: TEmailAction;
};

export function buildOwnerSuspensionLiftedEmail(
  input: TOwnerSuspensionLiftedEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
