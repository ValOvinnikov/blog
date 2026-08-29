import { asideSchema } from './aside';
import { blockTextSchema } from './block-text';
import { actionGroupSchema } from './blocks/action-group';
import { basicTextSchema } from './blocks/basic-text';
import { bodyImageSchema } from './body-image';
import { brandSchema } from './brand';
import { heroLayoutSchema } from './hero-layout';
import { imageWithAltSchema } from './image-with-alt';
import { layoutSchema } from './layout';
import { linkSchema } from './link';
import { openGraphSchema } from './open-graph';
import { richTextSchema } from './rich-text';
import {
  requiredHeadingSectionHeaderSchema,
  sectionHeaderSchema,
} from './section-header';
import { seoSchema } from './seo';
import { skimSchema } from './skim';
import { socialLinkSchema } from './social-link';
import { specLineSchema } from './spec-line';

export const objects = [
  layoutSchema,
  heroLayoutSchema,
  sectionHeaderSchema,
  requiredHeadingSectionHeaderSchema,
  imageWithAltSchema,
  bodyImageSchema,
  asideSchema,
  richTextSchema,
  blockTextSchema,
  basicTextSchema,
  socialLinkSchema,
  linkSchema,
  actionGroupSchema,
  openGraphSchema,
  seoSchema,
  specLineSchema,
  brandSchema,
  skimSchema,
];
