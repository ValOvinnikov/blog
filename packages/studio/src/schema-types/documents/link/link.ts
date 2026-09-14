import { SOCIAL_PLATFORMS } from '@blog/config/constants';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { toTitleCase } from '@blog/utils/primitives';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkDocument = {
  internalReference?: { _ref?: string };
  url?: string;
};

const hasInternalReference = (document: unknown): boolean =>
  Boolean((document as TLinkDocument | undefined)?.internalReference?._ref);

const hasUrl = (document: unknown): boolean =>
  Boolean((document as TLinkDocument | undefined)?.url);

/**
 * Enforces exactly one destination — an internal page or a URL, never zero,
 * never both — since there is no stored discriminator to fall back on.
 */
const validateExactlyOneTarget = (
  _value: unknown,
  context: { document?: unknown },
): string | true => {
  const internal = hasInternalReference(context.document);
  const url = hasUrl(context.document);

  if (internal && url) {
    return 'Choose either an internal page or a URL — not both.';
  }
  if (!internal && !url) {
    return 'Choose an internal page or enter a URL.';
  }
  return true;
};

export const linkSchema = defineType({
  name: 'link',
  title: 'Link',
  type: 'document',
  description:
    'A reusable link — set the destination once here, then point every header, footer, button, or in-text mention that needs it at this document instead of retyping the destination each time.',
  icon: Link2,
  fields: [
    titleField({
      description:
        'How this link is named in the Links library, for finding it again in search and lists — never shown to site visitors.',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description:
        'The visible link text readers see wherever this link is used.',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'internalReference',
      title: 'Internal Document',
      type: 'reference',
      description: 'A page within this site for the link to go to.',
      to: [
        { type: PAGE_POST_TYPE },
        { type: topicSchema.name },
        { type: PAGE_LANDING_TYPE },
        { type: PAGE_POST_INDEX_TYPE },
      ],
      validation: (rule) => rule.custom(validateExactlyOneTarget),
    }),
    defineField({
      name: 'url',
      title: 'URL or Path',
      type: 'string',
      description:
        'Use a relative path such as /blog or a full URL such as https://example.com, for a link that goes outside the pages above.',
      validation: (rule) => [
        rule.custom(validateExactlyOneTarget),
        rule.custom((value: string | undefined) => {
          if (!value) return true;
          if (!value.startsWith('/') && !/^https?:\/\//.test(value)) {
            return 'Use a relative path starting with / or a full http(s) URL.';
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      description:
        'Opens the link in a new browser tab instead of navigating away from the current page.',
      initialValue: false,
      hidden: ({ document }) => !hasUrl(document),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description:
        'The social platform this link points to, used to pick which icon represents it wherever the link is shown.',
      options: {
        layout: 'dropdown',
        list: Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      label: 'label',
      internalTitle: 'internalReference.title',
      url: 'url',
    },
    prepare({ title, label, internalTitle, url }) {
      const destination = internalTitle
        ? String(internalTitle)
        : String(url ?? 'No destination set');

      return {
        title: String(title ?? 'Untitled Link'),
        subtitle: label ? `${String(label)} — ${destination}` : destination,
      };
    },
  },
});
