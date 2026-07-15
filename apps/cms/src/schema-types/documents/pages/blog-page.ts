import { titleField } from '@cms/schema-types/helpers/title-field';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { Newspaper } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const blogPageSchema = defineType({
  name: 'page_blog',
  title: 'Blog Page',
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
      name: 'itemsPerPage',
      title: 'Items Per Page',
      type: 'number',
      description: 'Posts shown per page.',
      initialValue: 9,
      validation: (rule) => rule.required().min(1).max(24).integer(),
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
