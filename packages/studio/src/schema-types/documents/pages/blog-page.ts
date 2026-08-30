import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { Newspaper } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const blogPageSchema = defineType({
  name: 'page_blog',
  title: 'Post Index Page',
  type: 'document',
  icon: Newspaper,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Blog singleton',
      };
    },
  },
  fields: [
    titleField(),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The main heading shown at the top of the page.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      description: 'Optional line shown under the heading.',
    }),
    defineField({
      name: 'postList',
      title: 'Post List',
      type: 'reference',
      description: 'The paginated post archive rendered on this page.',
      to: [{ type: postListSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineModulesField({
      allow: [ctaSchema.name, newsletterSchema.name],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Blog page meta title, description, and social sharing image.',
    }),
  ],
});
