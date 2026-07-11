import { House } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  icon: House,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title as string | undefined,
        subtitle: 'Home singleton',
      };
    },
  },
  initialValue: {
    title: 'Home Page',
    modules: [
      {
        _type: 'module_hero',
        _key: 'hero',
        heroEyebrowMode: 'postCategory',
        heroTitleMode: 'postTitle',
        heroSubtitleMode: 'postExcerpt',
        heroImageMode: 'postImage',
        primaryActionLabel: 'Read more',
      },
      {
        _type: 'module_postList',
        _key: 'postList',
        title: 'Latest',
        limit: 6,
      },
    ],
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal title for editors. The root route remains /.',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      description: 'Ordered content blocks that build the Home page.',
      of: [
        defineArrayMember({ type: 'module_hero' }),
        defineArrayMember({ type: 'module_postList' }),
        defineArrayMember({ type: 'module_cta' }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description:
        'Override Home page meta title, description, and social sharing image.',
    }),
  ],
});
