import type { TValueOf } from '@blog/config/utils';

export const PORTABLE_TEXT_BLOCK_TYPE = {
  BODY_IMAGE: 'bodyImage',
  ASIDE: 'aside',
  LINK_REF: 'linkRef',
} as const;

export type TPortableTextBlockType = TValueOf<typeof PORTABLE_TEXT_BLOCK_TYPE>;
