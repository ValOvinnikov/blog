import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const topicIndexPageSchema = defineType({
  name: 'page_topicIndex',
  title: 'Topic Index Page',
  type: 'document',
  icon: Tags,
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
        subtitle: 'Topic index singleton',
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
        'Override Topic Index page meta title, description, and social sharing image.',
    }),
  ],
});
