import { defineArrayMember, defineType } from 'sanity';

import { imageWithAltSchema } from './image-with-alt';

export const richTextSchema = defineType({
  name: 'richText',
  title: 'Rich Text',
  type: 'array',
  of: [
    defineArrayMember({ type: 'block' }),
    defineArrayMember({ type: imageWithAltSchema.name }),
    defineArrayMember({ type: 'code' }),
  ],
});
