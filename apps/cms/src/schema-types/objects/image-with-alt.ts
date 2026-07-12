import { defineField, defineType } from 'sanity';

export const imageWithAltSchema = defineType({
  name: 'imageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      description: 'Describe the image for screen readers and search engines.',
      validation: (rule) => rule.required(),
    }),
  ],
});
