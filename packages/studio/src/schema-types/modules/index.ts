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
