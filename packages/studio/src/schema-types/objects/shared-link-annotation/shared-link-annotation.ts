import { sharedLinkSchema } from '@blog/studio/schema-types/documents/shared/link/link';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/**
 * Marks selected body text as a link to a `shared_link` document. Kept as a
 * plain reference object because Portable Text annotations cannot be arrays.
 */
export const sharedLinkAnnotationSchema = defineType({
  name: 'sharedLinkAnnotation',
  title: 'Shared Link',
  type: 'object',
  description: 'Links the selected text to a shared link library document.',
  icon: Link2,
  fields: [
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'Which shared link the selected text points to.',
      to: [{ type: sharedLinkSchema.name }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'link.label',
      subtitle: 'link.title',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ? String(title) : 'Shared link',
        subtitle: subtitle ? String(subtitle) : undefined,
      };
    },
  },
});
