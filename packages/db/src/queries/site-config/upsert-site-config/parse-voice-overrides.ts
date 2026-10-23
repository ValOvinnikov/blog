import {
  VOICE_FIELDS,
  type TFieldErrors,
  type TVoiceFieldErrorReason,
  type TVoiceFieldFailuresByLocale,
  type TVoiceFieldId,
} from '@blog/config';
import {
  isLocaleIsoCode,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import type {
  TVoiceOverrides,
  TVoiceOverridesByLocale,
} from '@blog/db/schema/site-config';
import { errorResult, okResult, type TResult } from '@blog/utils';

import { validateVoiceFieldValue } from './validate-voice-field';

const VOICE_FIELDS_BY_ID = new Map(
  VOICE_FIELDS.map((field) => [field.id, field]),
);

/** Every field id the platform can send, mapped to the raw value it authored — not yet trimmed, size-checked or sanitized. */
export type TVoiceOverridesInput = Partial<Record<TVoiceFieldId, unknown>>;

export type TVoiceOverridesByLocaleInput = Partial<
  Record<TLocaleIsoCode, TVoiceOverridesInput>
>;

type TVoiceFieldErrors = TFieldErrors<TVoiceFieldId, TVoiceFieldErrorReason>;

/** Collects one failure per offending field; a key absent from `VOICE_FIELDS` is a malformed request and throws. */
function parseVoiceOverrides(
  raw: TVoiceOverridesInput,
): TResult<TVoiceOverrides, TVoiceFieldErrors> {
  const unknownKeys = Object.keys(raw).filter(
    (key) => !VOICE_FIELDS_BY_ID.has(key as TVoiceFieldId),
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `upsertSiteConfig: unknown voice override key(s): ${unknownKeys.join(', ')}.`,
    );
  }

  const value: TVoiceOverrides = {};
  const fieldErrors: TVoiceFieldErrors = {};

  for (const [key, rawValue] of Object.entries(raw)) {
    const field = VOICE_FIELDS_BY_ID.get(key as TVoiceFieldId)!;
    const result = validateVoiceFieldValue(field, rawValue);

    if (!result.ok) {
      fieldErrors[field.id] = result.error;
      continue;
    }
    if (result.data !== undefined) value[field.id] = result.data;
  }

  if (Object.keys(fieldErrors).length > 0) return errorResult(fieldErrors);

  return okResult(value);
}

export function assertKnownLocales(
  voiceOverridesByLocale: TVoiceOverridesByLocaleInput,
): void {
  const unknownLocales = Object.keys(voiceOverridesByLocale).filter(
    (locale) => !isLocaleIsoCode(locale),
  );
  if (unknownLocales.length > 0) {
    throw new Error(
      `upsertSiteConfig: unknown voice override locale(s): ${unknownLocales.join(', ')}.`,
    );
  }
}

export function parseVoiceOverridesByLocale(
  raw: TVoiceOverridesByLocaleInput,
): TResult<TVoiceOverridesByLocale, TVoiceFieldFailuresByLocale> {
  const value: TVoiceOverridesByLocale = {};
  const fieldErrorsByLocale: TVoiceFieldFailuresByLocale = {};

  for (const locale of Object.values(LOCALE_ISO_CODES)) {
    const overrides = raw[locale];
    if (overrides === undefined) continue;

    const result = parseVoiceOverrides(overrides);
    if (result.ok) value[locale] = result.data;
    else fieldErrorsByLocale[locale] = result.error;
  }

  if (Object.keys(fieldErrorsByLocale).length > 0) {
    return errorResult(fieldErrorsByLocale);
  }

  return okResult(value);
}
