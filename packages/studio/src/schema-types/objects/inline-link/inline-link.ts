import type { TMaybeUndefined } from '@blog/config';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
  LINK_TYPE,
} from '@blog/config/constants';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@blog/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { PAGE_LEGAL_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/legal-index/legal-index-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import { PAGE_PRIVACY_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-index/privacy-index-type';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { isString } from '@blog/utils/primitives';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkParent = {
  linkType?: string;
};

const isLinkType = (parent: unknown, linkType: string) =>
  (parent as TMaybeUndefined<TLinkParent>)?.linkType === linkType;

export const inlineLinkSchema = defineType({
  name: 'inlineLink',
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
        { type: PAGE_PRIVACY_INDEX_TYPE },
        { type: PAGE_PRIVACY_DOCUMENT_TYPE },
        { type: PAGE_LEGAL_INDEX_TYPE },
        { type: PAGE_LEGAL_DOCUMENT_TYPE },
        { type: PAGE_COOKIE_STATEMENT_TYPE },
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
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description: 'Optional social platform, used for icon selection.',
      options: {
        layout: 'dropdown',
        list: Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: SOCIAL_PLATFORM_LABEL[value],
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
            ? `Internal: ${
                isString(internalTitle)
                  ? internalTitle
                  : (defaultLanguageValue(internalTitle) ?? 'not selected')
              }`
            : String(url ?? 'URL not set'),
      };
    },
  },
});
