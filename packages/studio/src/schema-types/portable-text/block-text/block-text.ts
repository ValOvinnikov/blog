import { defineArrayMember, defineType } from 'sanity';

export const blockTextSchema = defineType({
  name: 'blockText',
  title: 'Block Text',
  type: 'array',
  description:
    'Plain paragraph text with no images or embeds, used for short bios and descriptions.',
  of: [defineArrayMember({ type: 'block' })],
});
