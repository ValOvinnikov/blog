import type { TValueOf } from '@blog/config/utils';

// Lowercase because the values are MediaFrame's ratio variant names.
export const MEDIA_RATIO = {
  VIDEO: 'video',
  VERTICAL: 'vertical',
  CLASSIC: 'classic',
  PORTRAIT: 'portrait',
} as const;

export type TMediaRatio = TValueOf<typeof MEDIA_RATIO>;
