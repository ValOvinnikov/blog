import {
  BRAND_TAGLINE_SEPARATOR_CHARS,
  BRAND_TAGLINE_SEPARATORS,
} from '@blog/config/constants';
import { brandTaglineItemSchema } from '@blog/studio/schema-types/objects/brand-tagline-item/brand-tagline-item';
import { toTitleCase } from '@blog/utils/primitives';
import { defineArrayMember, defineField, defineType } from 'sanity';

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
        'Up to 4 short segments (e.g. "build 2026.07", "online"), joined with the separator below. Every language shares the list; only the wording is translated.',
      of: [defineArrayMember({ type: brandTaglineItemSchema.name })],
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
