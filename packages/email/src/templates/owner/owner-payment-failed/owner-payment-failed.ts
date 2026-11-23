import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import type { TEmailDetail } from '@shinefold/email/html/email-details/email-details';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TOwnerPaymentFailedEmailInput = TOwnerEmailInput & {
  details: TEmailDetail[];
  nextRetry: TMaybeUndefined<TEmailDetail>;
  planEndingNotice: string;
  action: TEmailAction;
};

export function buildOwnerPaymentFailedEmail({
  paragraphs,
  details,
  nextRetry,
  planEndingNotice,
  ...input
}: TOwnerPaymentFailedEmailInput): TOwnerEmail {
  return buildOwnerEmail({
    ...input,
    paragraphs: nextRetry ? paragraphs : [...paragraphs, planEndingNotice],
    details: nextRetry ? [...details, nextRetry] : details,
  });
}
