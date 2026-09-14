import { LINK_TYPE } from '@blog/config/constants';
import { linkDestinationFields } from '@blog/studio/schema-types/fields/link-destination-fields/link-destination-fields';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/**
 * The one place a destination is authored — every `linkRef`/`socialLinkRef`/
 * `ctaActionRef` and Portable Text link points here instead of retyping it.
 */
export const sharedLinkSchema = defineType({
  name: 'shared_link',
  title: 'Link',
  type: 'document',
  description:
    'A reusable link — page or URL — that navigation, footer, buttons, and body text can all point to instead of retyping the same destination.',
  icon: Link2,
  initialValue: {
    linkType: LINK_TYPE.INTERNAL,
    openInNewTab: false,
  },
  fields: [
    titleField({
      description:
        'Library name used to find this link in Studio search and lists — not shown on the site.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description:
        'Default visible link text, shown wherever this link is used unless overridden for that use.',
      validation: (rule) => rule.required().max(40),
    }),
    ...linkDestinationFields(),
  ],
  preview: {
    select: {
      title: 'title',
      linkType: 'linkType',
      url: 'url',
      internalTitle: 'internalReference.title',
    },
    prepare({ title, linkType, url, internalTitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle:
          linkType === LINK_TYPE.INTERNAL
            ? `Internal: ${String(internalTitle ?? 'not selected')}`
            : String(url ?? 'URL not set'),
      };
    },
  },
});
