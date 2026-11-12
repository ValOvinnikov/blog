import type { TEmbedProvider } from '@blog/config';

export const EMBED_LOG = {
  MODULE_FETCH_FAILED: 'embed_module.fetch_failed',
} as const;

export const EMBED_PROVIDER_NAME = {
  YOUTUBE: 'YouTube',
  VIMEO: 'Vimeo',
  LOOM: 'Loom',
  CAL: 'Cal.com',
  GOOGLE_MAPS: 'Google Maps',
} as const satisfies Record<TEmbedProvider, string>;
