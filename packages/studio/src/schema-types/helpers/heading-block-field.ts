import {
  headingBlockSchema,
  requiredHeadingBlockSchema,
} from '@blog/studio/schema-types/objects/heading-block';
import { defineField } from 'sanity';

export const headingBlockField = (
  options: { requireHeading?: boolean; description?: string } = {},
) =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: options.requireHeading
      ? requiredHeadingBlockSchema.name
      : headingBlockSchema.name,
    description:
      options.description ??
      'Optional heading and supporting text shown above this module.',
  });
