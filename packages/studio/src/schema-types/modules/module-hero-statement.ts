import { defineHeroFields } from '@blog/studio/schema-types/helpers/define-hero-fields';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { Quote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const heroStatementSchema = defineType({
  name: 'module_heroStatement',
  title: 'Statement Hero',
  type: 'document',
  icon: Quote,
  fields: [
    titleField(),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Optional small line above the heading.',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The page heading. Renders as the page’s <h1>.',
      validation: (rule) => [
        rule.required().error('A statement hero is its heading. Give it one.'),
        rule.max(120),
      ],
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      rows: 3,
      description: 'Optional single paragraph under the heading.',
    }),
    ...defineHeroFields(),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: subtitle ? String(subtitle) : 'No heading yet',
      };
    },
  },
});
