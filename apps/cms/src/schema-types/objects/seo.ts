import { defineField, defineType } from 'sanity';

import { openGraphSchema } from './open-graph';

export const seoSchema = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description:
        'Overrides the page title in search results. Keep under 60 characters.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description:
        'Summary shown in search results. Keep between 120–160 characters.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph',
      type: openGraphSchema.name,
      description: 'Social-sharing overrides (title, description, image).',
    }),
  ],
});
