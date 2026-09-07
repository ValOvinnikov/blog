/**
 * The 8 curated voice-override fields, grouped for the admin form —
 * the Postgres-backed field set matching
 * `packages/db`'s `voiceOverridesSchema` (`upsert-site-config.ts`) exactly.
 * Display text for `groupKey`/`key` lives in `i18n/messages/en.json` under
 * `voiceFieldGroups`/`voiceFieldLabels`, not here.
 */
export type TVoiceOverrideKey =
  | 'notFoundHeading'
  | 'notFoundSupportingText'
  | 'notFoundReturnHome'
  | 'blogListEmpty'
  | 'topicEmpty'
  | 'tagEmpty'
  | 'topicsEmpty'
  | 'bookmarksEmpty';

export type TVoiceOverrides = Record<TVoiceOverrideKey, string>;

export type TVoiceField = {
  key: TVoiceOverrideKey;
  /** Longer-form copy (descriptions, empty states) renders as a `Textarea`; short prompts/commands/labels render as a single-line `TextInput`. */
  multiline?: boolean;
};

type TVoiceFieldGroupKey = 'notFoundPage' | 'emptyStates';

export type TVoiceFieldGroup = {
  groupKey: TVoiceFieldGroupKey;
  fields: TVoiceField[];
};

export const VOICE_FIELD_GROUPS: TVoiceFieldGroup[] = [
  {
    groupKey: 'notFoundPage',
    fields: [
      { key: 'notFoundHeading' },
      { key: 'notFoundSupportingText', multiline: true },
      { key: 'notFoundReturnHome' },
    ],
  },
  {
    groupKey: 'emptyStates',
    fields: [
      { key: 'blogListEmpty', multiline: true },
      { key: 'topicEmpty', multiline: true },
      { key: 'tagEmpty', multiline: true },
      { key: 'topicsEmpty', multiline: true },
      { key: 'bookmarksEmpty', multiline: true },
    ],
  },
];

export const VOICE_OVERRIDE_KEYS: TVoiceOverrideKey[] =
  VOICE_FIELD_GROUPS.flatMap((group) => group.fields.map((field) => field.key));

/** The DOM id shared by a voice field's control and its associated `<label htmlFor>`. */
export const voiceFieldInputId = (key: TVoiceOverrideKey): string =>
  `voice-field-${key}`;
