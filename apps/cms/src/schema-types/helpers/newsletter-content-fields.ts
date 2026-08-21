import { defineField } from 'sanity';

/**
 * Shared `heading`/`description` field pair for newsletter signup copy,
 * used by both `module_newsletter` and the site-wide `settings_newsletter`
 * singleton. Both are flat top-level fields (not a nested object) — `service`
 * queries/transformers and the generated types depend on that shape.
 *
 * `heading` is required: there is no i18n fallback copy to fall back to if
 * it's left empty. `description` stays optional supporting copy.
 */
export const newsletterContentFields = () => [
  defineField({
    name: 'heading',
    title: 'Heading',
    type: 'string',
    description:
      'Signup heading shown wherever the newsletter form is rendered.',
    validation: (rule) => rule.required().max(80),
  }),
  defineField({
    name: 'description',
    title: 'Description',
    type: 'text',
    description: 'Supporting copy shown under the heading.',
    validation: (rule) => rule.max(300),
  }),
];
