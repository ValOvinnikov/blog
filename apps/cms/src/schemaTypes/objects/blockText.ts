import { defineArrayMember, defineType } from 'sanity';

export default defineType({
  name: 'blockText',
  title: 'Block Text',
  type: 'array',
  of: [defineArrayMember({ type: 'block' })],
});
