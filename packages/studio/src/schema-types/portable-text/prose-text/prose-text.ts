import { defineArrayMember, defineType } from 'sanity';

export const proseTextSchema = defineType({
  name: 'proseText',
  title: 'Prose Text',
  type: 'array',
  description:
    'Plain paragraph text with no images or embeds, used for short bios and descriptions.',
  of: [defineArrayMember({ type: 'block' })],
});
