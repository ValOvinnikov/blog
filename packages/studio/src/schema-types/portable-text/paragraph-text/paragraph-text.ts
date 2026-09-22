import {
  listedTextMarks,
  listedTextStyles,
} from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { defineArrayMember, defineType } from 'sanity';

export const paragraphTextSchema = defineType({
  name: 'paragraphText',
  title: 'Paragraph Text',
  type: 'array',
  description:
    'Plain paragraph text with no images or embeds, used for short bios and descriptions.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: listedTextStyles,
      lists: [],
      marks: listedTextMarks,
    }),
  ],
});
