import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
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
        title: title ?? 'Unknown',
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
      to: HERO_SCHEMA_TYPES.map((schema) => ({ type: schema.name })),
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [
        contentSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        postLatestSchema.name,
      ],
      validateCustom: (rule) =>
        rule.custom(validateSingleBlankHeadingPerType([postLatestSchema.name])),
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
