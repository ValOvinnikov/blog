import { titleField } from '@cms/schema-types/helpers/title-field';
import { taxonomyListSchema } from '@cms/schema-types/modules/module-taxonomy-list';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const tagIndexPageSchema = defineType({
  name: 'page_tagIndex',
  title: 'Tag Index Page',
  type: 'document',
  icon: Tag,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Tag index singleton',
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
      name: 'taxonomyList',
      title: 'Taxonomy List',
      type: 'reference',
      description: 'The taxonomy list rendered on this page.',
      to: [{ type: taxonomyListSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Tag Index page meta title, description, and social sharing image.',
    }),
  ],
});
