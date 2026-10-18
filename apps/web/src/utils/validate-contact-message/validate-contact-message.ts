import type { TFieldErrors } from '@blog/config';
import {
  FIELD_ERROR,
  type TFieldErrorReason,
} from '@web/constants/field-error';
import { isValidEmail } from '@web/utils/is-valid-email';

const NAME_MAX_LENGTH = 100;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 5_000;

export type TContactField = 'name' | 'email' | 'message';

export type TContactMessageFields = Record<TContactField, string>;

export type TContactFieldErrors = TFieldErrors<
  TContactField,
  TFieldErrorReason
>;

type TContactMessageValidation =
  | { ok: true; data: TContactMessageFields }
  | { ok: false; fieldErrors: TContactFieldErrors };

// The name becomes the notification email's subject, a mail header.
const normalizeName = (name: string): string =>
  name.replace(/[\r\n]+/g, ' ').trim();

export const validateContactMessage = (
  fields: TContactMessageFields,
): TContactMessageValidation => {
  const name = normalizeName(fields.name);
  const email = fields.email.trim();
  const message = fields.message.trim();

  const fieldErrors: TContactFieldErrors = {};
  if (name.length < 1 || name.length > NAME_MAX_LENGTH) {
    fieldErrors.name = { reason: FIELD_ERROR.INVALID };
  }
  if (!isValidEmail(email)) {
    fieldErrors.email = { reason: FIELD_ERROR.INVALID };
  }
  if (
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH
  ) {
    fieldErrors.message = { reason: FIELD_ERROR.INVALID };
  }

  return Object.keys(fieldErrors).length > 0
    ? { ok: false, fieldErrors }
    : { ok: true, data: { name, email, message } };
};
