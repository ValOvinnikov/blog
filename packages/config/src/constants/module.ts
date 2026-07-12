import type { AllSanitySchemaTypes } from '../sanity/generated/types';
import type { TValueOf } from '../utils';

/**
 * Union of every module document `_type`, derived from the generated Sanity
 * types rather than hand-maintained — the schema's own `name:` field is the
 * single source of truth for these values (see `apps/cms/src/schema-types/modules`).
 */
export type TModuleType = Extract<
  AllSanitySchemaTypes,
  { _type: `module_${string}` }
>['_type'];

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
