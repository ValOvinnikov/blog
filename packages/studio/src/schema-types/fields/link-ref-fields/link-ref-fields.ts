import { sharedLinkSchema } from '@blog/studio/schema-types/documents/shared/link/link';
import { defineField } from 'sanity';

/**
 * The shared-link reference plus its per-use override, spread into every
 * wrapper (`linkRef`, `socialLinkRef`, `ctaActionRef`) that authors a link
 * by choosing a `shared_link` document rather than retyping a destination.
 */
export const linkRefFields = () => [
  defineField({
    name: 'link',
    title: 'Link',
    type: 'reference',
    description: 'Which shared link this points to.',
    to: [{ type: sharedLinkSchema.name }],
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: 'labelOverride',
    title: 'Label Override',
    type: 'string',
    description:
      "Shown instead of the shared link's own label, for this use only. Leave empty to use the shared link's label as-is.",
  }),
];
