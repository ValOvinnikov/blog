import type { TValueOf } from '../utils';

export const MODULE_TYPE = {
  HERO: 'module_hero',
  POST_LIST: 'module_postList',
  CONTENT: 'module_content',
  CTA: 'module_cta',
} as const;

export type TModuleType = TValueOf<typeof MODULE_TYPE>;

/**
 * Source-mode values for the hero module's mode/custom field pairs
 * (`heroEyebrowMode`, `heroTitleMode`, `heroSubtitleMode`, `heroImageMode`).
 *
 * UPPERCASE key/value per convention; datasets are clean so no migration
 * needed.
 */
export const HERO_FIELD_MODE = {
  CUSTOM: 'CUSTOM',
  NONE: 'NONE',
  POST_CATEGORY: 'POST_CATEGORY',
  POST_TITLE: 'POST_TITLE',
  POST_EXCERPT: 'POST_EXCERPT',
  POST_IMAGE: 'POST_IMAGE',
} as const;

export type THeroFieldMode = TValueOf<typeof HERO_FIELD_MODE>;
