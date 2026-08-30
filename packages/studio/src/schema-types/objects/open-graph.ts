import { defineField, defineType } from 'sanity';

import { imageWithAltSchema } from './image-with-alt';

export const openGraphSchema = defineType({
  name: 'openGraph',
  title: 'Open Graph',
  type: 'object',
  fields: [
    defineField({
      name: 'ogTitle',
      title: 'OG Title',
      type: 'string',
      description:
        'Title shown when shared on social media. Defaults to meta title if empty.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG Description',
      type: 'text',
      description:
        'Description shown when shared on social media. Defaults to meta description if empty.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image',
      type: imageWithAltSchema.name,
      description:
        'Image shown when shared on social media. Recommended size: 1200×630 px.',
    }),
  ],
});
