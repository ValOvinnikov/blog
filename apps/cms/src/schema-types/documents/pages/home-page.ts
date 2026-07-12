import { MODULE_TYPE } from '@blog/config/constants';
import { House } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { defineModulesField } from '../../helpers/define-modules-field';
import { titleField } from '../../helpers/title-field';

export const homePageSchema = defineType({
  name: 'page_home',
  title: 'Home Page',
  type: 'document',
  icon: House,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: (title as string | undefined) ?? 'Home Page',
        subtitle: 'Home singleton',
      };
    },
  },
  fields: [
    titleField(),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'reference',
      description: 'The hero module rendered at the top of the home page.',
      to: [{ type: MODULE_TYPE.HERO }],
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [MODULE_TYPE.POST_LIST, MODULE_TYPE.CTA],
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
