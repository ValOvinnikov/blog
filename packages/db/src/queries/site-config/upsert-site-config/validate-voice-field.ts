import {
  type VOICE_FIELDS,
  portableTextToPlainText,
  VOICE_FIELD_ERROR,
  VOICE_FIELD_KIND,
  type TVoiceFieldErrorReason,
  type TVoiceFieldFailure,
  type TVoicePortableText,
} from '@blog/config';
import type { TVoiceOverrideValue } from '@blog/db/schema/site-config';

import { normalizeRichValue } from './normalize-voice-rich-text';

const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;

type TVoiceField = (typeof VOICE_FIELDS)[number];

type TVoiceFieldValidation =
  | { ok: true; value: TVoiceOverrideValue | undefined }
  | { ok: false; error: TVoiceFieldFailure };

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
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== 'string') {
    return { ok: false, error: { reason: VOICE_FIELD_ERROR.NOT_A_STRING } };
  }

  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: undefined };

  if (field.kind === VOICE_FIELD_KIND.TEXT && /[\r\n]/.test(trimmed)) {
    return { ok: false, error: { reason: VOICE_FIELD_ERROR.LINE_BREAK } };
  }

  if (trimmed.length > field.max) {
    return { ok: false, error: tooLongFailure(field) };
  }

  const placeholderError = findPlaceholderError(trimmed, field.placeholders);
  if (placeholderError) return { ok: false, error: placeholderError };

  return { ok: true, value: trimmed };
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
  if (isBlankRichValue(value)) return { ok: true, value: undefined };

  const plainText = portableTextToPlainText(value);
  if (plainText.length > field.max) {
    return { ok: false, error: tooLongFailure(field) };
  }

  const placeholderError = findPlaceholderError(plainText, field.placeholders);
  if (placeholderError) return { ok: false, error: placeholderError };

  return { ok: true, value };
}

function validateRichField(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };

  if (typeof raw === 'string') {
    return finalizeRichValue(field, coercePlainStringToRichValue(raw));
  }

  if (!Array.isArray(raw)) {
    return { ok: false, error: { reason: VOICE_FIELD_ERROR.NOT_RICH_TEXT } };
  }
  if (raw.length === 0) return { ok: true, value: undefined };

  const normalized = normalizeRichValue(raw);
  if (!normalized.ok) return normalized;

  return finalizeRichValue(field, normalized.value);
}

export function validateVoiceFieldValue(
  field: TVoiceField,
  raw: unknown,
): TVoiceFieldValidation {
  return field.kind === VOICE_FIELD_KIND.RICH
    ? validateRichField(field, raw)
    : validateTextField(field, raw);
}
