import { SOCIAL_PLATFORMS, TLINK_TYPE } from '@blog/config/constants';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { toTitleCase } from '@blog/utils/primitives';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkParent = {
  linkType?: string;
};

const isLinkType = (parent: unknown, linkType: string) =>
  (parent as TLinkParent | undefined)?.linkType === linkType;

export const linkSchema = defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: Link2,
  initialValue: {
    linkType: TLINK_TYPE.INTERNAL,
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
      options: {
        layout: 'radio',
        list: [
          { title: 'Internal document', value: TLINK_TYPE.INTERNAL },
          { title: 'URL or path', value: TLINK_TYPE.EXTERNAL },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internalReference',
      title: 'Internal Document',
      type: 'reference',
      to: [
        { type: postSchema.name },
        { type: topicSchema.name },
        // Literal (not `genericSchema.name` / `blogPageSchema.name`):
        // importing page.ts or blog-page.ts here closes a circular import
        // (page/blog-page → module-cta → link) — typegen fails otherwise.
        { type: 'page_generic' },
        { type: 'page_blog' },
      ],
      hidden: ({ parent }) => !isLinkType(parent, TLINK_TYPE.INTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isLinkType(context.parent, TLINK_TYPE.INTERNAL) && !value) {
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
      hidden: ({ parent }) => !isLinkType(parent, TLINK_TYPE.EXTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.parent, TLINK_TYPE.EXTERNAL)) {
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
      hidden: ({ parent }) => !isLinkType(parent, TLINK_TYPE.EXTERNAL),
    }),
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
          linkType === TLINK_TYPE.INTERNAL
            ? `Internal: ${String(internalTitle ?? 'not selected')}`
            : String(url ?? 'URL not set'),
      };
    },
  },
});
