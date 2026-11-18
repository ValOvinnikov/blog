import { LINK_TYPE } from '@shinefold/config/constants';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { onePagePerTranslationGroupFilter } from '@shinefold/studio/schema-types/filters/one-page-per-translation-group';
import { localizedStringValues } from '@shinefold/studio/schema-types/validation/localized-string-values/localized-string-values';
import { TRANSLATED_DOCUMENT_TYPES } from '@shinefold/studio/translated-document-types';
import { hasLength } from '@shinefold/utils/primitives';
import { Link2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TLinkDocument = {
  linkType?: string;
};

const isLinkType = (document: unknown, linkType: string): boolean =>
  (document as TLinkDocument | undefined)?.linkType === linkType;

const INTERNAL_LINK_TITLE = 'Internal Link';
const EXTERNAL_LINK_TITLE = 'External Link';

const LINK_TYPE_OPTIONS = [
  { title: INTERNAL_LINK_TITLE, value: LINK_TYPE.INTERNAL },
  { title: EXTERNAL_LINK_TITLE, value: LINK_TYPE.EXTERNAL },
];

const LABEL_MAX_LENGTH = 60;

const INVALID_WEB_ADDRESS =
  'Enter a full web address starting with https:// or http://, including a host, e.g. https://example.com.';

const isWebAddress = (value: string): boolean => {
  try {
    const parsedUrl = new URL(value);

    return /^https?:$/.test(parsedUrl.protocol) && Boolean(parsedUrl.hostname);
  } catch {
    return false;
  }
};

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
      type: 'internationalizedArrayString',
      description:
        'The visible link text readers see wherever this link is used.',
      validation: (rule) =>
        rule.custom((value) => {
          const labels = localizedStringValues(value);

          if (!hasLength(labels)) {
            return 'Enter a label.';
          }

          if (labels.some((label) => label.length > LABEL_MAX_LENGTH)) {
            return `Keep each label to ${LABEL_MAX_LENGTH} characters or fewer.`;
          }

          return true;
        }),
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
      title: INTERNAL_LINK_TITLE,
      type: 'reference',
      description: 'The page this links to.',
      to: TRANSLATED_DOCUMENT_TYPES.map((type) => ({ type })),
      options: { filter: onePagePerTranslationGroupFilter },
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
      title: EXTERNAL_LINK_TITLE,
      type: 'internationalizedArrayString',
      description: 'The full web address this links to, including https://.',
      hidden: ({ document }) => !isLinkType(document, LINK_TYPE.EXTERNAL),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!isLinkType(context.document, LINK_TYPE.EXTERNAL)) {
            return true;
          }

          const urls = localizedStringValues(value);

          if (!hasLength(urls)) {
            return 'Enter a full web address, including https://.';
          }

          return urls.every(isWebAddress) ? true : INVALID_WEB_ADDRESS;
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
