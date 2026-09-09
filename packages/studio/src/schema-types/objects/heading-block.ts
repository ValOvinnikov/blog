import { defineField, defineType } from 'sanity';

const headingBlockFields = (options: { requireHeading?: boolean } = {}) => [
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

export const headingBlockSchema = defineType({
  name: 'headingBlock',
  title: 'Heading Block',
  type: 'object',
  fields: headingBlockFields(),
});

/**
 * Same shape as `headingBlockSchema` but `heading` is required — for
 * modules where an empty heading isn't a valid state (CTA, Newsletter).
 * Sanity field validation is fixed per named type, so a per-module override
 * needs a second registered type rather than one shared type with
 * conditional validation.
 */
export const requiredHeadingBlockSchema = defineType({
  name: 'requiredHeadingBlock',
  title: 'Heading Block',
  type: 'object',
  fields: headingBlockFields({ requireHeading: true }),
});
