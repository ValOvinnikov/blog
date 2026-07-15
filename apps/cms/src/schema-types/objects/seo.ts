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
        'Overrides the page title in search results. Leave empty to use the page content. Keep under 60 characters.',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description:
        'Overrides the summary shown in search results. Leave empty to use the page content. Keep between 120–160 characters.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph',
      type: openGraphSchema.name,
      description:
        'Overrides the social-sharing title, description, and image. Leave empty to use the page content.',
    }),
  ],
});
