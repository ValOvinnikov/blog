import { isValidEmail } from '@web/utils/is-valid-email';

const NAME_MAX_LENGTH = 100;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 5_000;

export type TContactField = 'name' | 'email' | 'message';

export type TContactMessageFields = Record<TContactField, string>;

type TContactMessageValidation =
  | { ok: true; data: TContactMessageFields }
  | { ok: false; invalidFields: TContactField[] };

// The name becomes the notification email's subject, a mail header.
const normalizeName = (name: string): string =>
  name.replace(/[\r\n]+/g, ' ').trim();

export const validateContactMessage = (
  fields: TContactMessageFields,
): TContactMessageValidation => {
  const name = normalizeName(fields.name);
  const email = fields.email.trim();
  const message = fields.message.trim();

  const invalidFields: TContactField[] = [];
  if (name.length < 1 || name.length > NAME_MAX_LENGTH) {
    invalidFields.push('name');
  }
  if (!isValidEmail(email)) {
    invalidFields.push('email');
  }
  if (
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH
  ) {
    invalidFields.push('message');
  }

  return invalidFields.length > 0
    ? { ok: false, invalidFields }
    : { ok: true, data: { name, email, message } };
};
