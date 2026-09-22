import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import {
  defineArrayMember,
  defineType,
  type BlockMarksDefinition,
  type BlockStyleDefinition,
} from 'sanity';

export const inlineTextStyles: BlockStyleDefinition[] = [
  { title: 'Normal', value: 'normal' },
];

export const inlineTextMarks: BlockMarksDefinition = {
  decorators: [
    { title: 'Bold', value: 'strong' },
    { title: 'Italic', value: 'em' },
  ],
  annotations: [{ type: linkRefSchema.name }],
};

export const inlineTextSchema = defineType({
  name: 'inlineText',
  title: 'Inline Text',
  type: 'array',
  description:
    'Short formatted text with bold, italics, lists, and links, but no headings or images.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: inlineTextStyles,
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: inlineTextMarks,
    }),
  ],
});
