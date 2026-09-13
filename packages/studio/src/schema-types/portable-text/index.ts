import { inlineTextSchema } from './inline-text/inline-text';
import { proseTextSchema } from './prose-text/prose-text';
import { richTextSchema } from './rich-text/rich-text';

export const portableText = [richTextSchema, proseTextSchema, inlineTextSchema];
