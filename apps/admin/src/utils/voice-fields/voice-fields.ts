/**
 * The 20 curated voice-override fields, grouped exactly as
 * `apps/cms/src/schema-types/documents/settings/voice.ts` defines them
 * (fieldset `title`s for groups, field `title`s for labels) — this is the
 * Postgres-backed port of that schema's field set, not a redesign of it.
 * Display text for `groupKey`/`key` lives in `i18n/messages/en.json` under
 * `voiceFieldGroups`/`voiceFieldLabels`, not here.
 */
export type TVoiceOverrideKey =
  | 'notFoundMetaTitle'
  | 'notFoundMetaDescription'
  | 'notFoundCommandNotFound'
  | 'notFoundDescription'
  | 'notFoundReturnHome'
  | 'terminalPromptHost'
  | 'authPromptCommandSignIn'
  | 'authPromptCommandAccount'
  | 'bookmarksPromptCommand'
  | 'accountPrivacyPromptCommand'
  | 'accountNewsletterPromptCommand'
  | 'accountIdentityPromptCommand'
  | 'bookmarkToastSavedMessage'
  | 'bookmarkToastRemovedMessage'
  | 'blogListEmpty'
  | 'categoryEmpty'
  | 'tagEmpty'
  | 'authorEmpty'
  | 'topicsEmpty'
  | 'bookmarksEmpty';

export type TVoiceOverrides = Record<TVoiceOverrideKey, string>;

export type TVoiceField = {
  key: TVoiceOverrideKey;
  /** Longer-form copy (descriptions, empty states) renders as a `Textarea`; short prompts/commands/labels render as a single-line `TextInput`. */
  multiline?: boolean;
};

type TVoiceFieldGroupKey =
  'notFoundPage' | 'terminalPrompts' | 'bookmarks' | 'emptyStates';

export type TVoiceFieldGroup = {
  groupKey: TVoiceFieldGroupKey;
  fields: TVoiceField[];
};

export const VOICE_FIELD_GROUPS: TVoiceFieldGroup[] = [
  {
    groupKey: 'notFoundPage',
    fields: [
      { key: 'notFoundMetaTitle' },
      { key: 'notFoundMetaDescription', multiline: true },
      { key: 'notFoundCommandNotFound' },
      { key: 'notFoundDescription', multiline: true },
      { key: 'notFoundReturnHome' },
    ],
  },
  {
    groupKey: 'terminalPrompts',
    fields: [
      { key: 'terminalPromptHost' },
      { key: 'authPromptCommandSignIn' },
      { key: 'authPromptCommandAccount' },
      { key: 'bookmarksPromptCommand' },
      { key: 'accountPrivacyPromptCommand' },
      { key: 'accountNewsletterPromptCommand' },
      { key: 'accountIdentityPromptCommand' },
    ],
  },
  {
    groupKey: 'bookmarks',
    fields: [
      { key: 'bookmarkToastSavedMessage' },
      { key: 'bookmarkToastRemovedMessage' },
    ],
  },
  {
    groupKey: 'emptyStates',
    fields: [
      { key: 'blogListEmpty', multiline: true },
      { key: 'categoryEmpty', multiline: true },
      { key: 'tagEmpty', multiline: true },
      { key: 'authorEmpty', multiline: true },
      { key: 'topicsEmpty', multiline: true },
      { key: 'bookmarksEmpty', multiline: true },
    ],
  },
];

export const VOICE_OVERRIDE_KEYS: TVoiceOverrideKey[] =
  VOICE_FIELD_GROUPS.flatMap((group) => group.fields.map((field) => field.key));
