export const isString = (value: unknown): value is string =>
  typeof value === 'string';

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

export const toInitial = (name: string): string | undefined =>
  name.normalize('NFC').match(LETTER_OR_DIGIT)?.[0]?.toUpperCase();

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export const countWords = (text: string): number =>
  text.match(WORD)?.length ?? 0;
