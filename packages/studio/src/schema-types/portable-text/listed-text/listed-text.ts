import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import {
  defineArrayMember,
  defineType,
  type BlockMarksDefinition,
  type BlockStyleDefinition,
} from 'sanity';

export const listedTextStyles: BlockStyleDefinition[] = [
  { title: 'Normal', value: 'normal' },
];

export const listedTextMarks: BlockMarksDefinition = {
  decorators: [
    { title: 'Bold', value: 'strong' },
    { title: 'Italic', value: 'em' },
  ],
  annotations: [{ type: linkRefSchema.name }],
};

export const listedTextSchema = defineType({
  name: 'listedText',
  title: 'Listed Text',
  type: 'array',
  description:
    'Short formatted text with bold, italics, lists, and links, but no headings or images.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: listedTextStyles,
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: listedTextMarks,
    }),
  ],
});
