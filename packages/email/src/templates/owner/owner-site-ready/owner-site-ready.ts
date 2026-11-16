import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TOwnerSiteReadyEmailInput = TOwnerEmailInput & {
  action: TEmailAction;
};

export function buildOwnerSiteReadyEmail(
  input: TOwnerSiteReadyEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
