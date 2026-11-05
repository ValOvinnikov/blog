import type { TValueOf } from '@blog/config/utils';

export const LOOK_GROUP = {
  STYLE: 'STYLE',
  SITE_PARTS: 'SITE_PARTS',
} as const;

export type TLookGroup = TValueOf<typeof LOOK_GROUP>;
