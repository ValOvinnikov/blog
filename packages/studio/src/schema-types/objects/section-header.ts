import { defineField, defineType } from 'sanity';

const sectionHeaderFields = (options: { requireHeading?: boolean } = {}) => [
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    validation: (rule) =>
      options.requireHeading ? rule.required().max(80) : rule.max(80),
  }),
  defineField({
    name: 'supportingText',
    title: 'Supporting Text',
    type: 'text',
    validation: (rule) => rule.max(300),
  }),
];

export const sectionHeaderSchema = defineType({
  name: 'sectionHeader',
  title: 'Section Header',
  type: 'object',
  fields: sectionHeaderFields(),
});

/**
 * Same shape as `sectionHeaderSchema` but `heading` is required — for
 * modules where an empty heading isn't a valid state (CTA, Newsletter).
 * Sanity field validation is fixed per named type, so a per-module override
 * needs a second registered type rather than one shared type with
 * conditional validation.
 */
export const requiredHeadingSectionHeaderSchema = defineType({
  name: 'requiredHeadingSectionHeader',
  title: 'Section Header',
  type: 'object',
  fields: sectionHeaderFields({ requireHeading: true }),
});
