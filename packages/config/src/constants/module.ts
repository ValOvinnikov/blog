import type { AllSanitySchemaTypes } from '@blog/config/sanity/generated/types';
import type { TValueOf } from '@blog/config/utils';

/**
 * Union of every module document `_type`, derived from the generated Sanity
 * types rather than hand-maintained — the schema's own `name:` field is the
 * single source of truth for these values (see `packages/studio/src/schema-types/modules`).
 */
export type TModuleType = Extract<
  AllSanitySchemaTypes,
  { _type: `module_${string}` }
>['_type'];

/**
 * Every module whose schema `name:` starts with `module_hero` — membership
 * in the hero family is a naming convention, not a hand-maintained list.
 */
export type THeroModuleType = Extract<TModuleType, `module_hero${string}`>;

/**
 * Every module that renders through a page's dedicated slot rather than
 * through `modules[]`.
 */
export type TSlotModuleType =
  THeroModuleType | 'module_postList' | 'module_taxonomyList';

export const isHeroModuleType = (type: string): type is THeroModuleType =>
  type.startsWith('module_hero');

/**
 * Source-mode values for the hero module's mode/custom field pairs
 * (`heroEyebrowMode`, `heroTitleMode`, `heroSubtitleMode`, `heroImageMode`).
 */
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
