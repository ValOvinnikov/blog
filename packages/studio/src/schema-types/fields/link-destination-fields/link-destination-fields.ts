import { LINK_TYPE } from '@blog/config/constants';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { defineField } from 'sanity';

type TLinkDestinationParent = {
  linkType?: string;
};

const isLinkType = (parent: unknown, linkType: string) =>
  (parent as TLinkDestinationParent | undefined)?.linkType === linkType;

/**
 * The link-type/destination fields shared by every link-shaped type — which
 * internal page or external address a link resolves to, and whether it
 * opens in a new tab. Shared by the legacy `link` object and the
 * `shared_link` document so the two keep identical destination behaviour.
 */
export const linkDestinationFields = () => [
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
];
