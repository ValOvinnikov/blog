import { defineField } from 'sanity';

import { headingBlockSchema } from './heading-block';

type THeadingBlockValue = { heading?: string };

const DEFAULT_REQUIRED_HEADING_MESSAGE = 'Heading is required.';

export const PAGE_HEADING_DESCRIPTION =
  "The page heading, shown as the page's H1 — except when a hero is set, which supplies its own H1 instead. Keep this filled in even then, so the page still has a heading if the hero is ever removed.";

/**
 * The shared `headingBlock` object field. `requireHeading` adds a
 * field-level rule blocking publish on an empty nested `heading`, with an
 * optional `requiredMessage` override — requiredness lives on the field,
 * not on a second registered type.
 */
export const headingBlockField = (
  options: {
    requireHeading?: boolean;
    description?: string;
    requiredMessage?: string;
  } = {},
) =>
  defineField({
    name: 'headingBlock',
    title: 'Heading Block',
    type: headingBlockSchema.name,
    description:
      options.description ?? 'The section heading shown above this module.',
    validation: options.requireHeading
      ? (rule) =>
          rule.custom((value: THeadingBlockValue | undefined) =>
            value?.heading
              ? true
              : (options.requiredMessage ?? DEFAULT_REQUIRED_HEADING_MESSAGE),
          )
      : undefined,
  });
