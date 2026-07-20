import { blockTextSchema } from './block-text';
import { brandSchema } from './brand';
import { imageWithAltSchema } from './image-with-alt';
import { linkSchema } from './link';
import { openGraphSchema } from './open-graph';
import { richTextSchema } from './rich-text';
import { seoSchema } from './seo';
import { socialLinkSchema } from './social-link';
import { specLineSchema } from './spec-line';

export const objects = [
  imageWithAltSchema,
  richTextSchema,
  blockTextSchema,
  socialLinkSchema,
  linkSchema,
  openGraphSchema,
  seoSchema,
  specLineSchema,
  brandSchema,
];
