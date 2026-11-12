import type { TValueOf } from '@blog/config/utils';

export const EMBED_PROVIDER = {
  YOUTUBE: 'YOUTUBE',
  VIMEO: 'VIMEO',
  LOOM: 'LOOM',
  CAL: 'CAL',
  GOOGLE_MAPS: 'GOOGLE_MAPS',
} as const;

export type TEmbedProvider = TValueOf<typeof EMBED_PROVIDER>;

export const EMBED_ORIGIN = {
  YOUTUBE: 'https://www.youtube-nocookie.com',
  VIMEO: 'https://player.vimeo.com',
  LOOM: 'https://www.loom.com',
  CAL: 'https://cal.com',
  GOOGLE_MAPS: 'https://www.google.com',
} as const satisfies Record<TEmbedProvider, string>;

export const EMBED_ORIGINS: readonly string[] = Object.values(EMBED_ORIGIN);
