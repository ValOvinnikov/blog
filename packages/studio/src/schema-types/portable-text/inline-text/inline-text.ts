import { inlineLinkSchema } from '@blog/studio/schema-types/objects/inline-link/inline-link';
import { defineArrayMember, defineType } from 'sanity';

export const inlineTextSchema = defineType({
  name: 'inlineText',
  title: 'Inline Text',
  type: 'array',
  description:
    'Short formatted text with bold, italics, lists, and links, but no headings or images.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [{ type: inlineLinkSchema.name }],
      },
    }),
  ],
  validation: (rule) => rule.max(6),
});
