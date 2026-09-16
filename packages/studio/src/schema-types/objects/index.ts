import {
  actionGroupSchema,
  ctaActionSchema,
} from './action-group/action-group';
import { asideSchema } from './aside/aside';
import { bodyImageSchema } from './body-image/body-image';
import { brandSchema } from './brand/brand';
import { brandTaglineSchema } from './brand-tagline/brand-tagline';
import {
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
} from './cta-button/cta-button';
import { headingBlockSchema } from './heading-block/heading-block';
import { heroLayoutSchema } from './hero-layout/hero-layout';
import { imageWithAltSchema } from './image-with-alt/image-with-alt';
import { inlineLinkSchema } from './inline-link/inline-link';
import { layoutSchema } from './layout/layout';
import { linkRefSchema } from './link-ref/link-ref';
import { openGraphSchema } from './open-graph/open-graph';
import { postTakeawaysSchema } from './post-takeaways/post-takeaways';
import { seoSchema } from './seo/seo';
import { socialLinkSchema } from './social-link/social-link';

export const objects = [
  layoutSchema,
  heroLayoutSchema,
  headingBlockSchema,
  imageWithAltSchema,
  bodyImageSchema,
  asideSchema,
  socialLinkSchema,
  inlineLinkSchema,
  linkRefSchema,
  ctaActionSchema,
  actionGroupSchema,
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
  openGraphSchema,
  seoSchema,
  brandTaglineSchema,
  brandSchema,
  postTakeawaysSchema,
];
