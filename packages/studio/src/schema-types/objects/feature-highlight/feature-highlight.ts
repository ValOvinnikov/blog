import { ctaSecondaryButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { listedTextSchema } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { Columns2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const featureHighlightSchema = defineType({
  name: 'featureHighlight',
  title: 'Highlight',
  type: 'object',
  description: 'One row of the story, pairing an image with its text.',
  icon: Columns2,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The point this row makes, in a few words.',
      validation: (rule) => rule.required().error('Give the row a heading.'),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: listedTextSchema.name,
      description: 'The explanation, with bold, italics, lists and links.',
      validation: (rule) => rule.required().error("Write the row's text."),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        'Shown at 4:3 beside the text. Product screenshots and illustrations work best.',
      validation: (rule) => rule.required().error("Add the row's image."),
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: ctaSecondaryButtonSchema.name,
      description: 'Optional. One action under the text.',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      media: 'image',
    },
  },
});
