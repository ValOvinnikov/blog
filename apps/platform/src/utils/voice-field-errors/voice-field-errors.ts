import {
  LOCALE_ISO_CODES,
  VOICE_FIELDS,
  type TFieldErrorsByLocale,
  type TVoiceFieldId,
} from '@blog/config';
import {
  VOICE_FIELD_ERROR,
  type TVoiceFieldErrorReason,
} from '@platform/constants/voice';
import type { TVoiceFieldErrorsByLocale } from '@platform/utils/voice-draft/voice-draft';

export type TVoiceFieldFailuresByLocale = TFieldErrorsByLocale<
  TVoiceFieldId,
  TVoiceFieldErrorReason
>;

/** The stored-override validator explains each rejection in a sentence, which rides along as the failure's `detail`. */
export const toVoiceFieldFailures = (
  messagesByLocale: TVoiceFieldErrorsByLocale,
): TVoiceFieldFailuresByLocale => {
  const failuresByLocale: TVoiceFieldFailuresByLocale = {};
  for (const locale of Object.values(LOCALE_ISO_CODES)) {
    const messages = messagesByLocale[locale];
    if (!messages) continue;
    const failures: TVoiceFieldFailuresByLocale[typeof locale] = {};
    for (const { id } of VOICE_FIELDS) {
      const detail = messages[id];
      if (detail !== undefined) {
        failures[id] = {
          reason: VOICE_FIELD_ERROR.REJECTED,
          values: { detail },
        };
      }
    }
    failuresByLocale[locale] = failures;
  }
  return failuresByLocale;
};

export const toVoiceFieldMessages = (
  failuresByLocale: TVoiceFieldFailuresByLocale,
): TVoiceFieldErrorsByLocale => {
  const messagesByLocale: TVoiceFieldErrorsByLocale = {};
  for (const locale of Object.values(LOCALE_ISO_CODES)) {
    const failures = failuresByLocale[locale];
    if (!failures) continue;
    const messages: TVoiceFieldErrorsByLocale[typeof locale] = {};
    for (const { id } of VOICE_FIELDS) {
      const detail = failures[id]?.values?.detail;
      if (detail !== undefined) messages[id] = String(detail);
    }
    messagesByLocale[locale] = messages;
  }
  return messagesByLocale;
};
