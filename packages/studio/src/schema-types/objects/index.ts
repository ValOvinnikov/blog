import { asideSchema } from './aside/aside';
import { bodyImageSchema } from './body-image/body-image';
import { brandSchema } from './brand/brand';
import { brandTaglineSchema } from './brand-tagline/brand-tagline';
import {
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
} from './cta-button/cta-button';
import { featureHighlightSchema } from './feature-highlight/feature-highlight';
import { headingBlockSchema } from './heading-block/heading-block';
import { heroLayoutSchema } from './hero-layout/hero-layout';
import { imageWithAltSchema } from './image-with-alt/image-with-alt';
import { inlineLinkSchema } from './inline-link/inline-link';
import { layoutSchema } from './layout/layout';
import { linkRefSchema } from './link-ref/link-ref';
import { logoItemSchema } from './logo-item/logo-item';
import { openGraphSchema } from './open-graph/open-graph';
import { postTakeawaysSchema } from './post-takeaways/post-takeaways';
import { pricingPriceSchema } from './pricing-price/pricing-price';
import { pricingTierSchema } from './pricing-tier/pricing-tier';
import { seoSchema } from './seo/seo';
import { socialProfileSchema } from './social-profile/social-profile';
import { statSchema } from './stat/stat';
import { timelineItemSchema } from './timeline-item/timeline-item';

export const objects = [
  layoutSchema,
  heroLayoutSchema,
  headingBlockSchema,
  imageWithAltSchema,
  bodyImageSchema,
  asideSchema,
  inlineLinkSchema,
  linkRefSchema,
  logoItemSchema,
  socialProfileSchema,
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
  featureHighlightSchema,
  openGraphSchema,
  seoSchema,
  brandTaglineSchema,
  brandSchema,
  postTakeawaysSchema,
  statSchema,
  timelineItemSchema,
  pricingPriceSchema,
  pricingTierSchema,
];
