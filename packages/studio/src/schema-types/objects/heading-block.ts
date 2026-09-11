import { defineField, defineType } from 'sanity';

const headingBlockFields = (options: { requireHeading?: boolean } = {}) => [
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    validation: options.requireHeading ? (rule) => rule.required() : undefined,
  }),
  defineField({
    name: 'supportingText',
    title: 'Supporting Text',
    type: 'text',
  }),
];

export const headingBlockSchema = defineType({
  name: 'headingBlock',
  title: 'Heading Block',
  type: 'object',
  options: { collapsible: true, collapsed: false },
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
  options: { collapsible: true, collapsed: false },
  fields: headingBlockFields({ requireHeading: true }),
});
