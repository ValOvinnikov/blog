/**
 * The 20 curated voice-override fields, grouped and labelled exactly as
 * `apps/cms/src/schema-types/documents/settings/voice.ts` defines them
 * (fieldset `title`s for groups, field `title`s for labels) — this is the
 * Postgres-backed port of that schema's field set, not a redesign of it.
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
  label: string;
  /** Longer-form copy (descriptions, empty states) renders as a `Textarea`; short prompts/commands/labels render as a single-line `TextInput`. */
  multiline?: boolean;
};

export type TVoiceFieldGroup = {
  title: string;
  fields: TVoiceField[];
};

export const VOICE_FIELD_GROUPS: TVoiceFieldGroup[] = [
  {
    title: '404 page',
    fields: [
      { key: 'notFoundMetaTitle', label: 'Not Found Meta Title' },
      {
        key: 'notFoundMetaDescription',
        label: 'Not Found Meta Description',
        multiline: true,
      },
      { key: 'notFoundCommandNotFound', label: 'Not Found Command Not Found' },
      {
        key: 'notFoundDescription',
        label: 'Not Found Description',
        multiline: true,
      },
      { key: 'notFoundReturnHome', label: 'Not Found Return Home' },
    ],
  },
  {
    title: 'Terminal prompts',
    fields: [
      { key: 'terminalPromptHost', label: 'Terminal Prompt Host' },
      {
        key: 'authPromptCommandSignIn',
        label: 'Auth Prompt Command — Sign In',
      },
      {
        key: 'authPromptCommandAccount',
        label: 'Auth Prompt Command — Account',
      },
      { key: 'bookmarksPromptCommand', label: 'Bookmarks Prompt Command' },
      {
        key: 'accountPrivacyPromptCommand',
        label: 'Account Privacy Prompt Command',
      },
      {
        key: 'accountNewsletterPromptCommand',
        label: 'Account Newsletter Prompt Command',
      },
      {
        key: 'accountIdentityPromptCommand',
        label: 'Account Identity Prompt Command',
      },
    ],
  },
  {
    title: 'Bookmarks',
    fields: [
      { key: 'bookmarkToastSavedMessage', label: 'Bookmark Toast — Saved' },
      {
        key: 'bookmarkToastRemovedMessage',
        label: 'Bookmark Toast — Removed',
      },
    ],
  },
  {
    title: 'Empty states',
    fields: [
      { key: 'blogListEmpty', label: 'Blog List Empty', multiline: true },
      { key: 'categoryEmpty', label: 'Category Empty', multiline: true },
      { key: 'tagEmpty', label: 'Tag Empty', multiline: true },
      { key: 'authorEmpty', label: 'Author Empty', multiline: true },
      { key: 'topicsEmpty', label: 'Topics Empty', multiline: true },
      { key: 'bookmarksEmpty', label: 'Bookmarks Empty', multiline: true },
    ],
  },
];

export const VOICE_OVERRIDE_KEYS: TVoiceOverrideKey[] =
  VOICE_FIELD_GROUPS.flatMap((group) => group.fields.map((field) => field.key));
