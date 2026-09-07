import { contentSchema } from './module-content';
import { ctaSchema } from './module-cta';
import { heroSchema } from './module-hero';
import { newsletterSchema } from './module-newsletter';
import { postLatestSchema } from './module-post-latest';
import { postListSchema } from './module-post-list';
import { taxonomyListSchema } from './module-taxonomy-list';

export const modules = [
  heroSchema,
  postListSchema,
  postLatestSchema,
  taxonomyListSchema,
  contentSchema,
  ctaSchema,
  newsletterSchema,
];

/**
 * Every hero-family schema, listed by hand so a new `module_hero*` schema
 * added to `modules` above but forgotten here is caught by
 * the module registry test rather than silently being un-pickable in a page's
 * `hero` reference field.
 */
export const HERO_SCHEMA_TYPES = [heroSchema];
