import { defineModulesField } from '@cms/schema-types/helpers/define-modules-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { heroSchema } from '@cms/schema-types/modules/module-hero';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { House } from 'lucide-react';
import { defineField, defineType } from 'sanity';

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
