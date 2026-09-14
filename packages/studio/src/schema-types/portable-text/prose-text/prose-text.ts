import { hrefLinkAnnotation } from '@blog/studio/schema-types/objects/href-link-annotation/href-link-annotation';
import { sharedLinkAnnotationSchema } from '@blog/studio/schema-types/objects/shared-link-annotation/shared-link-annotation';
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
      marks: {
        annotations: [
          { type: sharedLinkAnnotationSchema.name },
          hrefLinkAnnotation(),
        ],
      },
    }),
  ],
});
