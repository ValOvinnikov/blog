import type { TEmailAction } from '@blog/email/html/email-action/email-action';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@blog/email/templates/owner/owner-email/owner-email';

export type TOwnerDowngradeGraceEmailInput = TOwnerEmailInput & {
  action: TEmailAction;
};

export function buildOwnerDowngradeGraceEmail(
  input: TOwnerDowngradeGraceEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
