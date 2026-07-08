import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkDocument = {
  linkType?: string;
};

const isLinkType = (document: unknown, linkType: string) =>
  (document as TLinkDocument | undefined)?.linkType === linkType;

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'document',
  icon: Link2,
  initialValue: {
    linkType: 'internal',
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
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          { title: 'Internal document', value: 'internal' },
          { title: 'URL or path', value: 'external' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internalReference',
      title: 'Internal Document',
      type: 'reference',
      to: [{ type: 'post' }, { type: 'category' }, { type: 'page' }],
      hidden: ({ document }) => !isLinkType(document, 'internal'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.document, 'internal') && !value) {
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
      hidden: ({ document }) => !isLinkType(document, 'external'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.document, 'external')) {
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
        title: title as string | undefined,
        subtitle:
          linkType === 'internal'
            ? `Internal: ${String(internalTitle ?? 'not selected')}`
            : String(url ?? 'URL not set'),
      };
    },
  },
});
