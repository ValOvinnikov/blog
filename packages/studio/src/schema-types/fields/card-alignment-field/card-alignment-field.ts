import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const cardAlignmentField = (options?: {
  title?: string;
  description?: string;
}) =>
  defineField({
    name: 'cardAlignment',
    title: options?.title ?? 'Card Alignment',
    type: 'string',
    description:
      options?.description ??
      'Horizontal alignment of the content within each card.',
    options: {
      layout: 'dropdown',
      list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER].map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: CONTENT_ALIGNMENT.LEFT,
    validation: (rule) => rule.required(),
  });
