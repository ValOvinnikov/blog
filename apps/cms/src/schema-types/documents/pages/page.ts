import { MODULE_TYPE } from '@blog/config/constants';
import { FileText } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: FileText,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Page headline shown in the browser tab and as the H1.',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      description: 'Ordered content blocks that build the page.',
      of: [
        defineArrayMember({ type: MODULE_TYPE.CONTENT }),
        defineArrayMember({ type: MODULE_TYPE.CTA }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description:
        'Override meta title, description, and OG image for search engines.',
    }),
  ],
});
