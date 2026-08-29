import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { defineArrayMember, defineType } from 'sanity';

export const basicTextSchema = defineType({
  name: 'basicText',
  title: 'Basic Text',
  type: 'array',
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
        annotations: [{ type: linkSchema.name }],
      },
    }),
  ],
  validation: (rule) => rule.max(6),
});
