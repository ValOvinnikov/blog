import {
  inlineTextMarks,
  inlineTextStyles,
} from '@blog/studio/schema-types/portable-text/inline-text/inline-text';
import { defineArrayMember, defineType } from 'sanity';

export const proseTextSchema = defineType({
  name: 'proseText',
  title: 'Prose Text',
  type: 'array',
  description:
    'Plain paragraph text with no images or embeds, used for short bios and descriptions.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: inlineTextStyles,
      lists: [],
      marks: inlineTextMarks,
    }),
  ],
});
