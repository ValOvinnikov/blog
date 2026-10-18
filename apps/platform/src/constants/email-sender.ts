import type { TValueOf } from '@blog/config/utils';

export const EMAIL_SENDER_FIELD_ERROR = {
  SENDER_NAME_INVALID: 'SENDER_NAME_INVALID',
  CONTACT_RECIPIENT_INVALID: 'CONTACT_RECIPIENT_INVALID',
} as const;

export type TEmailSenderFieldErrorReason = TValueOf<
  typeof EMAIL_SENDER_FIELD_ERROR
>;
