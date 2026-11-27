import {
  ASIDE_KIND,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@shinefold/config/constants';
import { SITE_MESSAGES } from '@shinefold/config/voice';
import { paragraphTextSchema } from '@shinefold/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { toPlainText } from '@shinefold/studio/schema-types/portable-text/to-plain-text/to-plain-text';
import type { TTextBlock } from '@shinefold/utils/portable-text';
import { isOneOf } from '@shinefold/utils/primitives';
import { MessageSquareText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const excerpt = (text: string, wordCount = 12) => {
  const words = text.split(/\s+/).filter(Boolean);

  return words.length > wordCount
    ? `${words.slice(0, wordCount).join(' ')}…`
    : words.join(' ');
};

export const asideSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
  title: 'Aside',
  type: 'object',
  description:
    'A side note — such as a tip or warning — set apart from the main body text.',
  icon: MessageSquareText,
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description:
        'Pick the kind that matches the note: a tip for a helpful shortcut, a note for something worth knowing, a warning for something that can go wrong, why not for an option you chose against, a digression for a related tangent, and context for background the reader may need.',
      options: {
        layout: 'dropdown',
        list: Object.values(ASIDE_KIND).map((value) => ({
          title: SITE_MESSAGES.blogPostPage.asideKind[value],
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: paragraphTextSchema.name,
      description: 'The side note content.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { kind: 'kind', body: 'body' },
    prepare({ kind, body }: { kind?: string; body?: TTextBlock[] }) {
      return {
        title: isOneOf(Object.values(ASIDE_KIND), kind)
          ? SITE_MESSAGES.blogPostPage.asideKind[kind]
          : 'Unknown',
        subtitle: body ? excerpt(toPlainText(body)) : '',
      };
    },
  },
});
