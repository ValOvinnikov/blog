import type { TValueOf } from '@blog/config/utils';

export const EMBED_PROVIDER = {
  YOUTUBE: 'YOUTUBE',
  VIMEO: 'VIMEO',
  LOOM: 'LOOM',
  CAL: 'CAL',
  GOOGLE_MAPS: 'GOOGLE_MAPS',
} as const;

export type TEmbedProvider = TValueOf<typeof EMBED_PROVIDER>;

// Lowercase because the values are MediaFrame's ratio variant names.
export const EMBED_RATIO = {
  VIDEO: 'video',
  VERTICAL: 'vertical',
  CLASSIC: 'classic',
  PORTRAIT: 'portrait',
} as const;

export type TEmbedRatio = TValueOf<typeof EMBED_RATIO>;
