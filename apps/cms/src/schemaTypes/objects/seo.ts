import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
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
      type: 'imageWithAlt',
      description:
        'Image shown when shared on social media. Recommended size: 1200×630 px.',
    }),
  ],
});
