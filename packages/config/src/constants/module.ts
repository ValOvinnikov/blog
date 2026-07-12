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
 * The values are intentionally lowercase — they match content already stored
 * in the `production` dataset. Uppercasing them would itself be a data
 * migration; that's tracked as a Phase B follow-up, not done here. Only the
 * keys are UPPERCASE descriptors; the stored values stay as-is.
 */
export const HERO_FIELD_MODE = {
  CUSTOM: 'custom',
  NONE: 'none',
  POST_CATEGORY: 'postCategory',
  POST_TITLE: 'postTitle',
  POST_EXCERPT: 'postExcerpt',
  POST_IMAGE: 'postImage',
} as const;

export type THeroFieldMode = TValueOf<typeof HERO_FIELD_MODE>;
