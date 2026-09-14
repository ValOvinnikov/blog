import { SOCIAL_PLATFORMS, LINK_TYPE } from '@blog/config/constants';
import { linkDestinationFields } from '@blog/studio/schema-types/fields/link-destination-fields/link-destination-fields';
import { toTitleCase } from '@blog/utils/primitives';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const linkSchema = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  description:
    'A link to either an internal page or an external URL, with its own visible label.',
  icon: Link2,
  initialValue: {
    linkType: LINK_TYPE.INTERNAL,
    openInNewTab: false,
  },
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Visible link text.',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'accessibleLabel',
      title: 'Accessible Label',
      type: 'string',
      description:
        "Optional: override the accessible name announced by screen readers and used by search engines, when the visible link text alone isn't descriptive enough — e.g. a generic 'Read more' button. Leave empty to use the visible text as-is.",
    }),
    ...linkDestinationFields(),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description: 'Optional social platform, used for icon selection.',
      options: {
        list: Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
  preview: {
    select: {
      title: 'label',
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
