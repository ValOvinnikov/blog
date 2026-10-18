import {
  LOCALE_ISO_CODES,
  VOICE_FIELDS,
  type TVoiceFieldFailure,
  type TVoiceFieldFailuresByLocale,
} from '@blog/config';
import type { TVoiceFieldErrorsByLocale } from '@platform/utils/voice-draft/voice-draft';

export const toVoiceFieldMessages = (
  failuresByLocale: TVoiceFieldFailuresByLocale,
  toMessage: (failure: TVoiceFieldFailure) => string,
): TVoiceFieldErrorsByLocale => {
  const messagesByLocale: TVoiceFieldErrorsByLocale = {};
  for (const locale of Object.values(LOCALE_ISO_CODES)) {
    const failures = failuresByLocale[locale];
    if (!failures) continue;
    const messages: TVoiceFieldErrorsByLocale[typeof locale] = {};
    for (const { id } of VOICE_FIELDS) {
      const failure = failures[id];
      if (failure !== undefined) messages[id] = toMessage(failure);
    }
    messagesByLocale[locale] = messages;
  }
  return messagesByLocale;
};
