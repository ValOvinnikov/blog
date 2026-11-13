export const isString = (value: unknown): value is string =>
  typeof value === 'string';

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export const toInitial = (name: string): string | undefined =>
  name.normalize('NFC').match(LETTER_OR_DIGIT)?.[0]?.toUpperCase();
