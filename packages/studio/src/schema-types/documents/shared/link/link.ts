import { LINK_TYPE } from '@blog/config/constants';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TSharedLinkParent = {
  linkType?: string;
};

const isLinkType = (parent: unknown, linkType: string) =>
  (parent as TSharedLinkParent | undefined)?.linkType === linkType;

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
      to: [
        { type: PAGE_POST_TYPE },
        { type: topicSchema.name },
        { type: PAGE_LANDING_TYPE },
        { type: PAGE_POST_INDEX_TYPE },
      ],
      hidden: ({ parent }) => !isLinkType(parent, LINK_TYPE.INTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.parent, LINK_TYPE.INTERNAL) && !value) {
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
      hidden: ({ parent }) => !isLinkType(parent, LINK_TYPE.EXTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.parent, LINK_TYPE.EXTERNAL)) {
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
      hidden: ({ parent }) => !isLinkType(parent, LINK_TYPE.EXTERNAL),
    }),
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
