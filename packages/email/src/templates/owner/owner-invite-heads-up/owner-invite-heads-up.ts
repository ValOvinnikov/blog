import {
  buildOwnerEmail,
  type TOwnerEmail,
  type TOwnerEmailInput,
} from '@blog/email/templates/owner/owner-email/owner-email';

export type TOwnerInviteHeadsUpEmailInput = TOwnerEmailInput;

export function buildOwnerInviteHeadsUpEmail(
  input: TOwnerInviteHeadsUpEmailInput,
): TOwnerEmail {
  return buildOwnerEmail(input);
}
