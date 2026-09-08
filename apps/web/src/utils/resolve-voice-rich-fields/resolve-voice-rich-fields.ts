import {
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  type TVoicePortableText,
} from '@blog/config';
import { wrapVoiceText } from '@web/utils/wrap-voice-text';

type TVoiceField = (typeof VOICE_FIELDS)[number];
type TVoiceRichField = Extract<
  TVoiceField,
  { kind: typeof VOICE_FIELD_KIND.RICH }
>;

export type TVoiceRichFieldId = TVoiceRichField['id'];

const isRichField = (field: TVoiceField): field is TVoiceRichField =>
  field.kind === VOICE_FIELD_KIND.RICH;

const RICH_FIELDS = VOICE_FIELDS.filter(isRichField);

const getAtPath = (source: unknown, segments: readonly string[]): unknown =>
  segments.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);

const toVoicePortableText = (
  value: string | TVoicePortableText,
): TVoicePortableText =>
  typeof value === 'string' ? wrapVoiceText(value) : value;

/**
 * Resolves every RICH voice field to its stored override, or the catalog
 * default at its registry path wrapped as a single paragraph when no
 * override exists — the shared source `resolveTenantMessages` and
 * `getVoiceRich` both build their RICH values from.
 */
export const resolveVoiceRichFields = (
  overrides: Record<string, string | TVoicePortableText>,
  baseMessages: Record<string, unknown>,
): Record<TVoiceRichFieldId, TVoicePortableText> => {
  const entries = RICH_FIELDS.map((field) => {
    const override = overrides[field.id];
    if (override !== undefined) {
      return [field.id, toVoicePortableText(override)] as const;
    }

    const catalogValue = getAtPath(baseMessages, field.path.split('.'));
    return [
      field.id,
      wrapVoiceText(typeof catalogValue === 'string' ? catalogValue : ''),
    ] as const;
  });

  return Object.fromEntries(entries) as Record<
    TVoiceRichFieldId,
    TVoicePortableText
  >;
};
