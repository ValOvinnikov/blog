import {
  portableTextToPlainText,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  type TVoicePortableText,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { hasLength, isString } from '@blog/utils/primitives';
import { withoutDefaultCopy } from '@platform/utils/voice-default-copy/voice-default-copy';
import {
  voiceDefaultText,
  type TVoiceDraft,
  type TVoiceDraftValue,
  type TVoiceField,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { voiceTextToPortableText } from '@platform/utils/voice-portable-text/voice-portable-text';

type TStoredVoiceOverrides = Partial<
  Record<TLocaleIsoCode, Partial<Record<string, unknown>>>
>;

const toDraftValue = (
  field: TVoiceField,
  stored: unknown,
): TVoiceDraftValue => {
  if (field.kind === VOICE_FIELD_KIND.RICH) {
    if (Array.isArray(stored) && hasLength(stored)) {
      return stored as TVoicePortableText;
    }
    return isString(stored) && stored.trim() !== ''
      ? voiceTextToPortableText(field.id, stored)
      : null;
  }
  if (isString(stored)) return stored;
  return Array.isArray(stored)
    ? portableTextToPlainText(stored as TVoicePortableText)
    : '';
};

const buildLocaleDraft = (
  locale: TLocaleIsoCode,
  stored: Partial<Record<string, unknown>> | undefined,
): TVoiceLocaleDraft =>
  Object.fromEntries(
    VOICE_FIELDS.map((field) => [
      field.id,
      withoutDefaultCopy(
        toDraftValue(field, stored?.[field.id]),
        voiceDefaultText(locale, field),
      ),
    ]),
  ) as TVoiceLocaleDraft;

export const buildVoiceDraft = (
  stored: TStoredVoiceOverrides,
  liveLocales: TLocaleIsoCode[],
): TVoiceDraft =>
  Object.fromEntries(
    liveLocales.map((locale) => [
      locale,
      buildLocaleDraft(locale, stored[locale]),
    ]),
  );
