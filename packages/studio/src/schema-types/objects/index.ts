import {
  actionGroupSchema,
  ctaActionSchema,
} from './action-group/action-group';
import { asideSchema } from './aside/aside';
import { bodyImageSchema } from './body-image/body-image';
import { brandSchema } from './brand/brand';
import { brandTaglineSchema } from './brand-tagline/brand-tagline';
import { ctaActionRefSchema } from './cta-action-ref/cta-action-ref';
import { headingBlockSchema } from './heading-block/heading-block';
import { heroLayoutSchema } from './hero-layout/hero-layout';
import { imageWithAltSchema } from './image-with-alt/image-with-alt';
import { layoutSchema } from './layout/layout';
import { linkSchema } from './link/link';
import { linkRefSchema } from './link-ref/link-ref';
import { openGraphSchema } from './open-graph/open-graph';
import { postTakeawaysSchema } from './post-takeaways/post-takeaways';
import { seoSchema } from './seo/seo';
import { sharedLinkAnnotationSchema } from './shared-link-annotation/shared-link-annotation';
import { socialLinkSchema } from './social-link/social-link';
import { socialLinkRefSchema } from './social-link-ref/social-link-ref';

export const objects = [
  layoutSchema,
  heroLayoutSchema,
  headingBlockSchema,
  imageWithAltSchema,
  bodyImageSchema,
  asideSchema,
  socialLinkSchema,
  linkSchema,
  ctaActionSchema,
  actionGroupSchema,
  openGraphSchema,
  seoSchema,
  brandTaglineSchema,
  brandSchema,
  postTakeawaysSchema,
  linkRefSchema,
  socialLinkRefSchema,
  ctaActionRefSchema,
  sharedLinkAnnotationSchema,
];
