import type { TEmailAction } from '@blog/email/html/email-action/email-action';
import type { TEmailDetail } from '@blog/email/html/email-details/email-details';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@blog/email/templates/owner/owner-email/owner-email';

export type TOwnerReceiptEmailInput = TOwnerEmailInput & {
  details: TEmailDetail[];
  action: TEmailAction;
};

export function buildOwnerReceiptEmail(
  input: TOwnerReceiptEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
