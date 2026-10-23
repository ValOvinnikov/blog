import {
  type VOICE_FIELDS,
  portableTextToPlainText,
  VOICE_FIELD_ERROR,
  VOICE_FIELD_KIND,
  type TVoiceFieldErrorReason,
  type TVoiceFieldFailure,
  type TMaybeUndefined,
  type TVoicePortableText,
} from '@blog/config';
import type { TVoiceOverrideValue } from '@blog/db/schema/site-config';
import { errorResult, okResult, type TResult } from '@blog/utils';

import { normalizeRichValue } from './normalize-voice-rich-text';

const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;

type TVoiceField = (typeof VOICE_FIELDS)[number];

type TVoiceFieldValidation = TResult<
  TMaybeUndefined<TVoiceOverrideValue>,
  TVoiceFieldFailure
>;

function placeholderFailure(
  reason: TVoiceFieldErrorReason,
  tokens: string[],
): TVoiceFieldFailure {
  return {
    reason,
    values: {
      placeholders: tokens.map((token) => `{${token}}`).join(', '),
      count: tokens.length,
    },
  };
}

function tooLongFailure(field: TVoiceField): TVoiceFieldFailure {
  return { reason: VOICE_FIELD_ERROR.TOO_LONG, values: { max: field.max } };
}

function findPlaceholderError(
  text: string,
  placeholders: readonly string[],
): TVoiceFieldFailure | undefined {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const token = match[1];
    if (token !== undefined) found.add(token);
  }

  const missing = placeholders.filter((token) => !found.has(token));
  if (missing.length > 0) {
    return placeholderFailure(VOICE_FIELD_ERROR.MISSING_PLACEHOLDER, missing);
  }

  const unknown = [...found].filter((token) => !placeholders.includes(token));
  if (unknown.length > 0) {
    return placeholderFailure(VOICE_FIELD_ERROR.UNKNOWN_PLACEHOLDER, unknown);
  }

  return undefined;
}

function validateTextField(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  if (raw === undefined || raw === null) return okResult();
  if (typeof raw !== 'string') {
    return errorResult({ reason: VOICE_FIELD_ERROR.NOT_A_STRING });
  }

  const trimmed = raw.trim();
  if (trimmed === '') return okResult();

  if (field.kind === VOICE_FIELD_KIND.TEXT && /[\r\n]/.test(trimmed)) {
    return errorResult({ reason: VOICE_FIELD_ERROR.LINE_BREAK });
  }

  if (trimmed.length > field.max) {
    return errorResult(tooLongFailure(field));
  }

  const placeholderError = findPlaceholderError(trimmed, field.placeholders);
  if (placeholderError) return errorResult(placeholderError);

  return okResult(trimmed);
}

function isBlankRichValue(value: TVoicePortableText): boolean {
  return value.every((block) =>
    block.children.every((span) => span.text.trim() === ''),
  );
}

function coercePlainStringToRichValue(text: string): TVoicePortableText {
  return [
    {
      _type: 'block',
      _key: crypto.randomUUID(),
      style: 'normal',
      children: [
        { _type: 'span', _key: crypto.randomUUID(), text: text.trim() },
      ],
    },
  ];
}

function finalizeRichValue(
  field: TVoiceField,
  value: TVoicePortableText,
): TVoiceFieldValidation {
  if (isBlankRichValue(value)) return okResult();

  const plainText = portableTextToPlainText(value);
  if (plainText.length > field.max) {
    return errorResult(tooLongFailure(field));
  }

  const placeholderError = findPlaceholderError(plainText, field.placeholders);
  if (placeholderError) return errorResult(placeholderError);

  return okResult(value);
}

function validateRichField(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  if (raw === undefined || raw === null) return okResult();

  if (typeof raw === 'string') {
    return finalizeRichValue(field, coercePlainStringToRichValue(raw));
  }

  if (!Array.isArray(raw)) {
    return errorResult({ reason: VOICE_FIELD_ERROR.NOT_RICH_TEXT });
  }
  if (raw.length === 0) return okResult();

  const normalized = normalizeRichValue(raw);
  if (!normalized.ok) return normalized;

  return finalizeRichValue(field, normalized.data);
}

export function validateVoiceFieldValue(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  return field.kind === VOICE_FIELD_KIND.RICH
    ? validateRichField(field, raw)
    : validateTextField(field, raw);
}
