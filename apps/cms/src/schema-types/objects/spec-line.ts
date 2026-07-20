import {
  SPEC_LINE_SEPARATOR_CHARS,
  SPEC_LINE_SEPARATORS,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField, defineType } from 'sanity';

export const specLineSchema = defineType({
  name: 'specLine',
  title: 'Spec Line',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      description:
        'Up to 4 short segments (e.g. "build 2026.07", "online"), joined with the separator below.',
      of: [{ type: 'string', validation: (rule) => rule.min(1).max(15) }],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: 'separator',
      title: 'Separator',
      type: 'string',
      description: 'Character shown between each item.',
      options: {
        layout: 'dropdown',
        list: Object.values(SPEC_LINE_SEPARATORS).map((value) => ({
          title: `${toTitleCase(value)} (${SPEC_LINE_SEPARATOR_CHARS[value]})`,
          value,
        })),
      },
      initialValue: SPEC_LINE_SEPARATORS.DOT,
      validation: (rule) => rule.required(),
    }),
  ],
});
