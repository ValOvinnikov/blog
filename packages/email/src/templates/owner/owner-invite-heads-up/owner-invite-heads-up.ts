import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@shinefold/email/templates/owner/owner-email/owner-email';

export type TOwnerInviteHeadsUpEmailInput = TOwnerEmailInput;

export function buildOwnerInviteHeadsUpEmail(
  input: TOwnerInviteHeadsUpEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
