import { contentSchema } from './content/content';
import { ctaSchema } from './cta/cta';
import { faqSchema } from './faq/faq';
import { featureListSchema } from './feature-list/feature-list';
import { heroSchema } from './hero/hero';
import { heroBlogSchema } from './hero-blog/hero-blog';
import { heroProfileSchema } from './hero-profile/hero-profile';
import { heroStatementSchema } from './hero-statement/hero-statement';
import { logoWallSchema } from './logo-wall/logo-wall';
import { newsletterSchema } from './newsletter/newsletter';
import { postFeaturedSchema } from './post-featured/post-featured';
import { postLatestSchema } from './post-latest/post-latest';
import { postListSchema } from './post-list/post-list';
import { postRelatedSchema } from './post-related/post-related';
import { statsSchema } from './stats/stats';
import { taxonomyListSchema } from './taxonomy-list/taxonomy-list';
import { testimonialSchema } from './testimonial/testimonial';

export const modules = [
  heroSchema,
  heroBlogSchema,
  heroStatementSchema,
  heroProfileSchema,
  postListSchema,
  postLatestSchema,
  postFeaturedSchema,
  postRelatedSchema,
  taxonomyListSchema,
  featureListSchema,
  logoWallSchema,
  testimonialSchema,
  statsSchema,
  faqSchema,
  contentSchema,
  ctaSchema,
  newsletterSchema,
];
