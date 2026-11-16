import type { TValueOf } from '@shinefold/config/utils';

export const SANITY_PERSPECTIVE = {
  PUBLISHED: 'published',
  DRAFTS: 'drafts',
} as const;

export type TSanityPerspective = TValueOf<typeof SANITY_PERSPECTIVE>;
