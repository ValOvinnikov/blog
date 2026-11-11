import type { TValueOf } from '@blog/config/utils';

export const EMBED_PROVIDER = {
  YOUTUBE: 'YOUTUBE',
  VIMEO: 'VIMEO',
  LOOM: 'LOOM',
  CAL: 'CAL',
  GOOGLE_MAPS: 'GOOGLE_MAPS',
} as const;

export type TEmbedProvider = TValueOf<typeof EMBED_PROVIDER>;
