import {
  portableTextToPlainText,
  SITE_MESSAGES_BY_LOCALE,
  VOICE_FIELD_KIND,
  VOICE_FIELDS,
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoicePortableText,
  type TMaybeUndefined,
  type TVoiceSurface,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceOverridesByLocaleInput } from '@blog/db/queries/site-config';
import {
  hasLength,
  isNull,
  isString,
  isUndefined,
} from '@blog/utils/primitives';
import { VOICE_SECTION, type TVoiceSection } from '@platform/constants/voice';
import { isSameJson } from '@platform/utils/is-same-json/is-same-json';

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

export const VOICE_SECTIONS_IN_PAGE_ORDER = [
  VOICE_SECTION.ERROR_PAGES,
  VOICE_SECTION.EMPTY_STATES,
] as const satisfies TVoiceSection[];

export const VOICE_SURFACES_BY_SECTION = {
  [VOICE_SECTION.ERROR_PAGES]: [VOICE_SURFACE.NOT_FOUND, VOICE_SURFACE.ERROR],
  [VOICE_SECTION.EMPTY_STATES]: [
    VOICE_SURFACE.ARCHIVE,
    VOICE_SURFACE.BOOKMARKS,
  ],
} as const satisfies Record<TVoiceSection, TVoiceSurface[]>;

export const VOICE_SURFACES_IN_PAGE_ORDER =
  VOICE_SECTIONS_IN_PAGE_ORDER.flatMap(
    (section) => VOICE_SURFACES_BY_SECTION[section],
  );

export const voiceFieldsOf = (surface: TVoiceSurface): TVoiceField[] =>
  VOICE_FIELDS.filter((field) => field.surface === surface);

export type TVoiceFieldError = {
  locale: TLocaleIsoCode;
  fieldId: TVoiceFieldId;
};

const VOICE_FIELDS_IN_PAGE_ORDER =
  VOICE_SURFACES_IN_PAGE_ORDER.flatMap(voiceFieldsOf);

export const voiceErrorsInOrder = (
  errors: TVoiceFieldErrorsByLocale,
  selectedLocale: TLocaleIsoCode,
  liveLocales: TLocaleIsoCode[],
): TVoiceFieldError[] =>
  [
    selectedLocale,
    ...liveLocales.filter((locale) => locale !== selectedLocale),
  ].flatMap((locale) =>
    VOICE_FIELDS_IN_PAGE_ORDER.filter(
      ({ id }) => !isUndefined(errors[locale]?.[id]),
    ).map(({ id }) => ({ locale, fieldId: id })),
  );

type TVoiceErrorReveal = {
  locale: TLocaleIsoCode;
  listFieldId: TMaybeUndefined<TVoiceFieldId>;
};

export const voiceErrorReveal = ({
  locale,
  fieldId,
}: TVoiceFieldError): TVoiceErrorReveal => ({
  locale,
  listFieldId: voiceFieldsOf(VOICE_SURFACE.ARCHIVE).some(
    ({ id }) => id === fieldId,
  )
    ? fieldId
    : undefined,
});

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
    if (Array.isArray(stored) && hasLength(stored)) {
      return stored as TVoicePortableText;
    }
    return isString(stored) && stored.trim() !== ''
      ? toParagraph(field.id, stored)
      : null;
  }
  if (isString(stored)) return stored;
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
  isString(value) ? value.trim() !== '' : !isNull(value);

export const voiceValueAsText = (value: TVoiceDraftValue): string => {
  if (isNull(value)) return '';
  return isString(value) ? value : portableTextToPlainText(value);
};

export const countLanguageVoiceChanges = (
  saved: TVoiceDraft,
  draft: TVoiceDraft,
  locale: TLocaleIsoCode,
): number => {
  const savedValues = localeDraftOf(saved, locale);
  const draftValues = localeDraftOf(draft, locale);
  return VOICE_FIELDS.filter(
    ({ id }) => !isSameJson(savedValues[id], draftValues[id]),
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
        typeof node === 'object' && !isNull(node)
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      SITE_MESSAGES_BY_LOCALE[locale],
    );
  return isString(value) ? value : '';
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
  !isNull(value) && isVoiceValueCustomised(value)
    ? value
    : voiceDefaultText(locale, field);
