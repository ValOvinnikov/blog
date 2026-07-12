import { HERO_FIELD_MODE, MODULE_TYPE } from '@blog/config/constants';
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
        _type: MODULE_TYPE.HERO,
        _key: 'hero',
        heroEyebrowMode: HERO_FIELD_MODE.POST_CATEGORY,
        heroTitleMode: HERO_FIELD_MODE.POST_TITLE,
        heroSubtitleMode: HERO_FIELD_MODE.POST_EXCERPT,
        heroImageMode: HERO_FIELD_MODE.POST_IMAGE,
        primaryActionLabel: 'Read more',
      },
      {
        _type: MODULE_TYPE.POST_LIST,
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
        defineArrayMember({ type: MODULE_TYPE.HERO }),
        defineArrayMember({ type: MODULE_TYPE.POST_LIST }),
        defineArrayMember({ type: MODULE_TYPE.CTA }),
      ],
      validation: (rule) =>
        rule.custom((modules) => {
          const list = (modules as { _type?: string }[] | undefined) ?? [];
          const heroCount = list.filter(
            (module) => module._type === MODULE_TYPE.HERO,
          ).length;
          const postListCount = list.filter(
            (module) => module._type === MODULE_TYPE.POST_LIST,
          ).length;

          if (heroCount !== 1 || postListCount !== 1) {
            return 'The Home page must contain exactly one Hero module and exactly one Post List module.';
          }

          return true;
        }),
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
