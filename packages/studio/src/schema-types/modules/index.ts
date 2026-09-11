import { contentSchema } from './module-content';
import { ctaSchema } from './module-cta';
import { heroSchema } from './module-hero';
import { heroBlogSchema } from './module-hero-blog';
import { heroStatementSchema } from './module-hero-statement';
import { newsletterSchema } from './module-newsletter';
import { postFeaturedSchema } from './module-post-featured';
import { postLatestSchema } from './module-post-latest';
import { postListSchema } from './module-post-list';
import { postRelatedSchema } from './module-post-related';
import { taxonomyListSchema } from './module-taxonomy-list';

export const modules = [
  heroSchema,
  heroBlogSchema,
  heroStatementSchema,
  postListSchema,
  postLatestSchema,
  postFeaturedSchema,
  postRelatedSchema,
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
export const HERO_SCHEMA_TYPES = [
  heroSchema,
  heroBlogSchema,
  heroStatementSchema,
];
