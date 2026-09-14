import { linkRefFields } from '@blog/studio/schema-types/fields/link-ref-fields/link-ref-fields';
import { Link2 } from 'lucide-react';
import { defineType } from 'sanity';

export const linkRefSchema = defineType({
  name: 'linkRef',
  title: 'Link',
  type: 'object',
  description:
    'A link authored by choosing a shared link, with an optional label override for this use.',
  icon: Link2,
  fields: [...linkRefFields()],
  preview: {
    select: {
      labelOverride: 'labelOverride',
      linkLabel: 'link.label',
      linkTitle: 'link.title',
    },
    prepare({ labelOverride, linkLabel, linkTitle }) {
      return {
        title: String(labelOverride ?? linkLabel ?? 'Unknown'),
        subtitle: linkTitle ? String(linkTitle) : undefined,
      };
    },
  },
});
