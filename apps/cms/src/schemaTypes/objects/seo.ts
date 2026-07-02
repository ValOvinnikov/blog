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
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      description:
        'Summary shown in search results. Keep between 120–160 characters.',
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
