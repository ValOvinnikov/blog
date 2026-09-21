import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
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
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [{ type: linkRefSchema.name }],
      },
    }),
  ],
});
