import {
  portableTextToPlainText,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoicePortableText,
  type TVoiceSurface,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';

export type TVoiceField = (typeof VOICE_FIELDS)[number];

export type TVoiceDraftValue = string | TVoicePortableText | null;

export type TVoiceLocaleDraft = Record<TVoiceFieldId, TVoiceDraftValue>;

export type TVoiceDraft = Partial<Record<TLocaleIsoCode, TVoiceLocaleDraft>>;

export type TVoiceFieldErrors = Partial<Record<TVoiceFieldId, string>>;

export type TVoiceFieldErrorsByLocale = Partial<
  Record<TLocaleIsoCode, TVoiceFieldErrors>
>;

type TStoredVoiceOverrides = Partial<
  Record<TLocaleIsoCode, Partial<Record<string, unknown>>>
>;

export const VOICE_SURFACES_IN_PAGE_ORDER = [
  VOICE_SURFACE.NOT_FOUND,
  VOICE_SURFACE.ERROR,
  VOICE_SURFACE.ARCHIVE,
  VOICE_SURFACE.BOOKMARKS,
] as const satisfies TVoiceSurface[];

export const voiceFieldsOf = (surface: TVoiceSurface): TVoiceField[] =>
  VOICE_FIELDS.filter((field) => field.surface === surface);

export const voiceFieldInputId = (
  idPrefix: string,
  id: TVoiceFieldId,
): string => `${idPrefix}-${id}`;

const toParagraph = (id: TVoiceFieldId, text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: `${id}-block`,
    style: 'normal',
    children: [{ _type: 'span', _key: `${id}-span`, text }],
  },
];

const toDraftValue = (
  field: TVoiceField,
  stored: unknown,
): TVoiceDraftValue => {
  if (field.kind === VOICE_FIELD_KIND.RICH) {
    if (Array.isArray(stored) && stored.length > 0) {
      return stored as TVoicePortableText;
    }
    return typeof stored === 'string' && stored.trim() !== ''
      ? toParagraph(field.id, stored)
      : null;
  }
  if (typeof stored === 'string') return stored;
  return Array.isArray(stored)
    ? portableTextToPlainText(stored as TVoicePortableText)
    : '';
};

const buildLocaleDraft = (
  stored: Partial<Record<string, unknown>> | undefined,
): TVoiceLocaleDraft =>
  Object.fromEntries(
    VOICE_FIELDS.map((field) => [
      field.id,
      toDraftValue(field, stored?.[field.id]),
    ]),
  ) as TVoiceLocaleDraft;

const EMPTY_LOCALE_DRAFT = buildLocaleDraft(undefined);

export const buildVoiceDraft = (
  stored: TStoredVoiceOverrides,
  liveLocales: TLocaleIsoCode[],
): TVoiceDraft =>
  Object.fromEntries(
    liveLocales.map((locale) => [locale, buildLocaleDraft(stored[locale])]),
  );

export const localeDraftOf = (
  draft: TVoiceDraft,
  locale: TLocaleIsoCode,
): TVoiceLocaleDraft => draft[locale] ?? EMPTY_LOCALE_DRAFT;

export const withVoiceValue = (
  draft: TVoiceDraft,
  locale: TLocaleIsoCode,
  id: TVoiceFieldId,
  value: TVoiceDraftValue,
): TVoiceDraft => ({
  ...draft,
  [locale]: { ...localeDraftOf(draft, locale), [id]: value },
});

export const isVoiceValueCustomised = (value: TVoiceDraftValue): boolean =>
  typeof value === 'string' ? value.trim() !== '' : value !== null;

export const isSameVoiceValue = (
  a: TVoiceDraftValue,
  b: TVoiceDraftValue,
): boolean => JSON.stringify(a) === JSON.stringify(b);

export const voiceValueAsText = (value: TVoiceDraftValue): string => {
  if (value === null) return '';
  return typeof value === 'string' ? value : portableTextToPlainText(value);
};

export const countLanguageVoiceChanges = (
  saved: TVoiceDraft,
  draft: TVoiceDraft,
  locale: TLocaleIsoCode,
): number => {
  const savedValues = localeDraftOf(saved, locale);
  const draftValues = localeDraftOf(draft, locale);
  return VOICE_FIELDS.filter(
    ({ id }) => !isSameVoiceValue(savedValues[id], draftValues[id]),
  ).length;
};

export const countVoiceChanges = (
  saved: TVoiceDraft,
  draft: TVoiceDraft,
  liveLocales: TLocaleIsoCode[],
): number =>
  liveLocales.reduce(
    (total, locale) => total + countLanguageVoiceChanges(saved, draft, locale),
    0,
  );

export const countCustomisedVoiceFields = (
  values: TVoiceLocaleDraft,
  fields: readonly TVoiceField[] = VOICE_FIELDS,
): number =>
  fields.filter(({ id }) => isVoiceValueCustomised(values[id])).length;

export const voiceDefaultText = (
  locale: TLocaleIsoCode,
  field: TVoiceField,
): string => {
  const value = field.path
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      SITE_MESSAGES_BY_LOCALE[locale],
    );
  return typeof value === 'string' ? value : '';
};

export const toVoiceOverridesInput = (
  draft: TVoiceDraft,
  liveLocales: TLocaleIsoCode[],
): TVoiceOverridesByLocaleInput =>
  Object.fromEntries(
    liveLocales.map((locale) => {
      const values = localeDraftOf(draft, locale);
      const customised = VOICE_FIELDS.filter(({ id }) =>
        isVoiceValueCustomised(values[id]),
      ).map(({ id }) => [id, values[id]]);
      return [locale, Object.fromEntries(customised)];
    }),
  );

export const resolveVoiceValue = (
  locale: TLocaleIsoCode,
  field: TVoiceField,
  value: TVoiceDraftValue,
): string | TVoicePortableText =>
  value !== null && isVoiceValueCustomised(value)
    ? value
    : voiceDefaultText(locale, field);
