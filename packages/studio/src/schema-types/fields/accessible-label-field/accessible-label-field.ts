import { defineField } from 'sanity';

export const accessibleLabelField = () =>
  defineField({
    name: 'accessibleLabel',
    title: 'Accessible Label',
    type: 'string',
    description:
      "Optional: override the accessible name announced by screen readers and used by search engines, when the visible link text alone isn't descriptive enough — e.g. a generic 'Read more' button. Leave empty to use the visible text as-is.",
  });
