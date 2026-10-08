export const VOICE_SURFACE = {
  ARCHIVE: 'ARCHIVE',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
  BOOKMARKS: 'BOOKMARKS',
} as const;

export type TVoiceSurface = (typeof VOICE_SURFACE)[keyof typeof VOICE_SURFACE];
