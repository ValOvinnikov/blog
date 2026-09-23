import { Hash } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const statSchema = defineType({
  name: 'stat',
  title: 'Stat',
  type: 'object',
  description: 'One figure and what it counts, for a band of stats.',
  icon: Hash,
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The figure as it should read. Kept short.',
      validation: (rule) => [
        rule.required(),
        rule
          .max(8)
          .warning(
            'Long values stop reading as a figure — try an abbreviation like 2.4M.',
          ),
      ],
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'What the figure counts. A few words, not a sentence.',
      validation: (rule) => [
        rule.required(),
        rule
          .max(48)
          .warning(
            'Long labels wrap under narrow columns — a few words reads best.',
          ),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description:
        'Optional line of context under the label — scope, period, or sample.',
    }),
  ],
  preview: {
    select: {
      title: 'value',
      subtitle: 'label',
    },
  },
});
