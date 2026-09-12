import { defineArrayMember, defineType } from 'sanity';

export const blockTextSchema = defineType({
  name: 'blockText',
  title: 'Block Text',
  type: 'array',
  of: [defineArrayMember({ type: 'block' })],
});
