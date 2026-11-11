import { textSizedIcon } from '@blog/studio/schema-types/icons/text-sized-icon/text-sized-icon';

import { contactFormSchema } from './contact-form/contact-form';
import { contentSchema } from './content/content';
import { cookieSettingsSchema } from './cookie-settings/cookie-settings';
import { ctaSchema } from './cta/cta';
import { embedSchema } from './embed/embed';
import { faqSchema } from './faq/faq';
import { featureHighlightsSchema } from './feature-highlights/feature-highlights';
import { featureListSchema } from './feature-list/feature-list';
import { heroBlogSchema } from './hero-blog/hero-blog';
import { heroProfileSchema } from './hero-profile/hero-profile';
import { heroStatementSchema } from './hero-statement/hero-statement';
import { logoWallSchema } from './logo-wall/logo-wall';
import { newsletterSchema } from './newsletter/newsletter';
import { postFeaturedSchema } from './post-featured/post-featured';
import { postLatestSchema } from './post-latest/post-latest';
import { postListSchema } from './post-list/post-list';
import { postRelatedSchema } from './post-related/post-related';
import { pricingSchema } from './pricing/pricing';
import { sectionPagesSchema } from './section-pages/section-pages';
import { statsSchema } from './stats/stats';
import { taxonomyListSchema } from './taxonomy-list/taxonomy-list';
import { teamSchema } from './team/team';
import { testimonialSchema } from './testimonial/testimonial';
import { timelineSchema } from './timeline/timeline';

export const modules = [
  heroBlogSchema,
  heroStatementSchema,
  heroProfileSchema,
  postListSchema,
  postLatestSchema,
  postFeaturedSchema,
  postRelatedSchema,
  taxonomyListSchema,
  featureListSchema,
  featureHighlightsSchema,
  logoWallSchema,
  testimonialSchema,
  teamSchema,
  statsSchema,
  timelineSchema,
  faqSchema,
  contentSchema,
  ctaSchema,
  newsletterSchema,
  contactFormSchema,
  cookieSettingsSchema,
  pricingSchema,
  sectionPagesSchema,
  embedSchema,
].map((schema) => ({ ...schema, icon: textSizedIcon(schema.icon) }));
