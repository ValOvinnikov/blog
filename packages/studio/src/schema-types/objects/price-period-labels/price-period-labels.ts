import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const PERIOD_LABEL_FIELDS = [
  {
    name: 'oneTime',
    title: 'One-time',
    description: 'Wording beside a price that is paid once.',
  },
  {
    name: 'hour',
    title: 'Per hour',
    description: 'Wording beside a price charged by the hour.',
  },
  {
    name: 'session',
    title: 'Per session',
    description: 'Wording beside a price charged for each session.',
  },
  {
    name: 'month',
    title: 'Per month',
    description: 'Wording beside a price charged every month.',
  },
  {
    name: 'year',
    title: 'Per year',
    description: 'Wording beside a price charged every year.',
  },
] as const;

export const pricePeriodLabelsSchema = defineType({
  name: 'pricePeriodLabels',
  title: 'Price period labels',
  type: 'object',
  description:
    'How visitors read the period next to a price, in your own words.',
  icon: Tag,
  options: { collapsible: true, collapsed: false },
  fields: PERIOD_LABEL_FIELDS.map(({ name, title, description }) =>
    defineField({
      name,
      title,
      type: 'string',
      description,
      validation: (rule) => rule.required().max(24),
    }),
  ),
});
