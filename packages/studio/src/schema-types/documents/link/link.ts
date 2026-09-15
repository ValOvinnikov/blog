import { LINK_TYPE } from '@blog/config/constants';
import { LINK_PAGE_TYPES } from '@blog/studio/schema-types/documents/link/link-page-types';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkDocument = {
  linkType?: string;
};

const isLinkType = (document: unknown, linkType: string): boolean =>
  (document as TLinkDocument | undefined)?.linkType === linkType;

const LINK_TYPE_OPTIONS = [
  { title: 'Internal Link', value: LINK_TYPE.INTERNAL },
  { title: 'External Link', value: LINK_TYPE.EXTERNAL },
];

const LINK_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  LINK_TYPE_OPTIONS.map(({ title, value }) => [value, title]),
);

export const linkSchema = defineType({
  name: 'link',
  title: 'Link',
  type: 'document',
  description:
    'A reusable link — set the destination once here, then point every place that needs it at this document instead of retyping the destination each time.',
  icon: Link2,
  initialValue: {
    linkType: LINK_TYPE.INTERNAL,
    openInNewTab: false,
  },
  fields: [
    titleField(),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description:
        'The visible link text readers see wherever this link is used.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      description:
        'Whether this goes to a page within the site (Internal Link) or a web address outside it (External Link).',
      options: {
        layout: 'radio',
        list: LINK_TYPE_OPTIONS,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internalReference',
      title: 'Internal Link',
      type: 'reference',
      description: 'The page this links to.',
      to: LINK_PAGE_TYPES.map((type) => ({ type })),
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.INTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.document, LINK_TYPE.INTERNAL) && !value) {
            return 'Choose a page for an internal link.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'url',
      title: 'External Link',
      type: 'string',
      description: 'The full web address this links to, including https://.',
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.EXTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.document, LINK_TYPE.EXTERNAL)) {
            return true;
          }

          if (!value) {
            return 'Enter a full web address, including https://.';
          }

          let parsedUrl: URL;

          try {
            parsedUrl = new URL(value);
          } catch {
            return 'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.';
          }

          if (!/^https?:$/.test(parsedUrl.protocol) || !parsedUrl.hostname) {
            return 'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      description:
        'Opens the link in a new browser tab instead of navigating away from the current page.',
      initialValue: false,
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.EXTERNAL),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      linkType: 'linkType',
    },
    prepare({ title, linkType }) {
      const linkTypeLabel =
        LINK_TYPE_LABEL[String(linkType)] ?? 'No link type set';

      return {
        title: String(title ?? 'Untitled Link'),
        subtitle: linkTypeLabel,
      };
    },
  },
});
