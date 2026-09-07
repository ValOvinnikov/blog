export const VOICE_FIELD_KIND = {
  TEXT: 'TEXT',
  MULTILINE: 'MULTILINE',
  RICH: 'RICH',
} as const;

export type TVoiceFieldKind =
  (typeof VOICE_FIELD_KIND)[keyof typeof VOICE_FIELD_KIND];
