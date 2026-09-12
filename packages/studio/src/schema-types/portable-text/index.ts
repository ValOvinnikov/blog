import { basicTextSchema } from './basic-text/basic-text';
import { blockTextSchema } from './block-text/block-text';
import { richTextSchema } from './rich-text/rich-text';

export const portableText = [richTextSchema, blockTextSchema, basicTextSchema];
