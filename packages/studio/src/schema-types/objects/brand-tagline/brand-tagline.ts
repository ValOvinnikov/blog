import {
  BRAND_TAGLINE_SEPARATOR_CHARS,
  BRAND_TAGLINE_SEPARATORS,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, defineType } from 'sanity';

export const brandTaglineSchema = defineType({
  name: 'brandTagline',
  title: 'Tagline',
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
        list: Object.values(BRAND_TAGLINE_SEPARATORS).map((value) => ({
          title: `${toTitleCase(value)} (${BRAND_TAGLINE_SEPARATOR_CHARS[value]})`,
          value,
        })),
      },
      initialValue: BRAND_TAGLINE_SEPARATORS.DOT,
      validation: (rule) => rule.required(),
    }),
  ],
});
