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
        'Whether this link goes to a page within the site or to an external address.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Internal document', value: LINK_TYPE.INTERNAL },
          { title: 'URL or path', value: LINK_TYPE.EXTERNAL },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internalReference',
      title: 'Internal Document',
      type: 'reference',
      description:
        'The page this link goes to, when Link Type is Internal document.',
      to: LINK_PAGE_TYPES.map((type) => ({ type })),
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.INTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.document, LINK_TYPE.INTERNAL) && !value) {
            return 'Choose a document for an internal link.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'url',
      title: 'URL or Path',
      type: 'string',
      description:
        'Use a relative path such as /blog or a full URL such as https://example.com.',
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.EXTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.document, LINK_TYPE.EXTERNAL)) {
            return true;
          }

          if (!value) {
            return 'Enter a URL or path.';
          }

          if (!value.startsWith('/') && !/^https?:\/\//.test(value)) {
            return 'Use a relative path starting with / or a full http(s) URL.';
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
      label: 'label',
      linkType: 'linkType',
      internalTitle: 'internalReference.title',
      url: 'url',
    },
    prepare({ title, label, linkType, internalTitle, url }) {
      const destination =
        linkType === LINK_TYPE.INTERNAL
          ? String(internalTitle ?? 'No page selected')
          : String(url ?? 'No destination set');

      return {
        title: String(title ?? 'Untitled Link'),
        subtitle: label ? `${String(label)} — ${destination}` : destination,
      };
    },
  },
});
