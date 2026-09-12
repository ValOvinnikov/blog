import {
  actionGroupSchema,
  ctaActionSchema,
} from './action-group/action-group';
import { asideSchema } from './aside/aside';
import { bodyImageSchema } from './body-image/body-image';
import { brandSchema } from './brand/brand';
import { headingBlockSchema } from './heading-block/heading-block';
import { heroLayoutSchema } from './hero-layout/hero-layout';
import { imageWithAltSchema } from './image-with-alt/image-with-alt';
import { layoutSchema } from './layout/layout';
import { linkSchema } from './link/link';
import { openGraphSchema } from './open-graph/open-graph';
import { seoSchema } from './seo/seo';
import { skimSchema } from './skim/skim';
import { socialLinkSchema } from './social-link/social-link';
import { specLineSchema } from './spec-line/spec-line';

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
  specLineSchema,
  brandSchema,
  skimSchema,
];
