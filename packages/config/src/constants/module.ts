import type { AllSanitySchemaTypes } from '@blog/config/sanity/generated/types';

import type { TValueOf } from '@blog/config/utils';

export type TModuleType = Extract<
  AllSanitySchemaTypes,
  { _type: `module_${string}` }
>['_type'];

export type THeroModuleType = Extract<TModuleType, `module_hero${string}`>;

export const isHeroModuleType = (type: string): type is THeroModuleType =>
  type.startsWith('module_hero');

export const HERO_FIELD_MODE = {
  CUSTOM: 'CUSTOM',
  NONE: 'NONE',
  POST_TOPIC: 'POST_TOPIC',
  POST_TITLE: 'POST_TITLE',
  POST_EXCERPT: 'POST_EXCERPT',
  POST_IMAGE: 'POST_IMAGE',
} as const;

export type THeroFieldMode = TValueOf<typeof HERO_FIELD_MODE>;

export const HERO_VARIANT = {
  SPLIT: 'SPLIT',
  STACKED: 'STACKED',
  BANNER: 'BANNER',
} as const;

export type THeroVariant = TValueOf<typeof HERO_VARIANT>;

export const NEWSLETTER_VARIANT = {
  FULL: 'FULL',
  COMPACT: 'COMPACT',
} as const;

export type TNewsletterVariant = TValueOf<typeof NEWSLETTER_VARIANT>;

export const POST_SOURCE = {
  PINNED: 'PINNED',
  NEWEST_FEATURED: 'NEWEST_FEATURED',
} as const;

export type TPostSource = TValueOf<typeof POST_SOURCE>;

export const HERO_IMAGE_SOURCE = {
  POST: 'POST',
  CUSTOM: 'CUSTOM',
  NONE: 'NONE',
} as const;

export type THeroImageSource = TValueOf<typeof HERO_IMAGE_SOURCE>;
