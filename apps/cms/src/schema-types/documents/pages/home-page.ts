import { House } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { defineModulesField } from '../../helpers/define-modules-field';
import { titleField } from '../../helpers/title-field';
import { ctaSchema } from '../../modules/module-cta';
import { heroSchema } from '../../modules/module-hero';
import { postListSchema } from '../../modules/module-post-list';
import { seoSchema } from '../../objects/seo';

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
      to: [{ type: heroSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [postListSchema.name, ctaSchema.name],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Home page meta title, description, and social sharing image.',
    }),
  ],
});
