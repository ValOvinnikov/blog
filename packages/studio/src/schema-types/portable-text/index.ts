import { articleTextSchema } from './article-text/article-text';
import { expandableSectionTextSchema } from './expandable-section-text/expandable-section-text';
import { listedTextSchema } from './listed-text/listed-text';
import { paragraphTextSchema } from './paragraph-text/paragraph-text';

export const portableText = [
  articleTextSchema,
  paragraphTextSchema,
  listedTextSchema,
  expandableSectionTextSchema,
];
