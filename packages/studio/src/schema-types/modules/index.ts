import { contentSchema } from './content/content';
import { ctaSchema } from './cta/cta';
import { heroSchema } from './hero/hero';
import { heroBlogSchema } from './hero-blog/hero-blog';
import { heroStatementSchema } from './hero-statement/hero-statement';
import { newsletterSchema } from './newsletter/newsletter';
import { postFeaturedSchema } from './post-featured/post-featured';
import { postLatestSchema } from './post-latest/post-latest';
import { postListSchema } from './post-list/post-list';
import { postRelatedSchema } from './post-related/post-related';
import { taxonomyListSchema } from './taxonomy-list/taxonomy-list';

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
