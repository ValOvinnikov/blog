import { ASIDE_KIND } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { MessageSquareText } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { blockTextSchema } from './block-text';

type TAsideBlock = { children?: { text?: string }[] };

const toPlainText = (blocks: TAsideBlock[] = []) =>
  blocks
    .flatMap((block) => block.children ?? [])
    .map((child) => child.text ?? '')
    .join(' ')
    .trim();

const excerpt = (text: string, wordCount = 12) => {
  const words = text.split(/\s+/).filter(Boolean);

  return words.length > wordCount
    ? `${words.slice(0, wordCount).join(' ')}…`
    : words.join(' ');
};

export const asideSchema = defineType({
  name: 'aside',
  title: 'Aside',
  type: 'object',
  icon: MessageSquareText,
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description:
        'What kind of side note this is — drives its label and styling.',
      options: {
        layout: 'radio',
        list: Object.values(ASIDE_KIND).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: blockTextSchema.name,
      description: 'The side note content.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { kind: 'kind', body: 'body' },
    prepare({ kind, body }: { kind?: string; body?: TAsideBlock[] }) {
      return {
        title: kind ? toTitleCase(kind) : 'Unknown',
        subtitle: body ? excerpt(toPlainText(body)) : '',
      };
    },
  },
});
