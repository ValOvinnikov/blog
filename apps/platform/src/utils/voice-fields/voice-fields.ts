export type TVoiceOverrideKey =
  | 'notFoundHeading'
  | 'notFoundSupportingText'
  | 'blogListEmpty'
  | 'topicEmpty'
  | 'tagEmpty'
  | 'topicsEmpty'
  | 'bookmarksEmpty';

export type TVoiceOverrides = Record<TVoiceOverrideKey, string>;

export type TVoiceField = {
  key: TVoiceOverrideKey;
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
