import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { SOCIAL_PLATFORMS } from '../constants/social-platforms';

type TLinkParent = {
  linkType?: string;
};

const isLinkType = (parent: unknown, linkType: string) =>
  (parent as TLinkParent | undefined)?.linkType === linkType;

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: Link2,
  initialValue: {
    linkType: 'internal',
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
      hidden: ({ parent }) => !isLinkType(parent, 'internal'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.parent, 'internal') && !value) {
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
      hidden: ({ parent }) => !isLinkType(parent, 'external'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.parent, 'external')) {
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
      description: 'Only applies to external URLs or paths.',
      initialValue: false,
      hidden: ({ parent }) => !isLinkType(parent, 'external'),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description: 'Optional social platform, used for icon selection.',
      options: {
        list: [...SOCIAL_PLATFORMS],
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
        title: title as string | undefined,
        subtitle:
          linkType === 'internal'
            ? `Internal: ${String(internalTitle ?? 'not selected')}`
            : String(url ?? 'URL not set'),
      };
    },
  },
});
