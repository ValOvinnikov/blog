import {
  requiredHeadingSectionHeaderSchema,
  sectionHeaderSchema,
} from '@blog/studio/schema-types/objects/section-header';
import { defineField } from 'sanity';

export const sectionHeaderField = (
  options: { requireHeading?: boolean; description?: string } = {},
) =>
  defineField({
    name: 'sectionHeader',
    title: 'Section Header',
    type: options.requireHeading
      ? requiredHeadingSectionHeaderSchema.name
      : sectionHeaderSchema.name,
    description:
      options.description ??
      'Optional heading and supporting text shown above this module.',
  });
