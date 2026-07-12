import { defineArrayMember, defineType } from 'sanity';

export const richTextSchema = defineType({
  name: 'richText',
  title: 'Rich Text',
  type: 'array',
  of: [
    defineArrayMember({ type: 'block' }),
    defineArrayMember({ type: 'imageWithAlt' }),
    defineArrayMember({ type: 'code' }),
  ],
});
