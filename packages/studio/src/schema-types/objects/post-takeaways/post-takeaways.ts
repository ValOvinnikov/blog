import {
  POST_SUMMARY_MAX_BLOCKS,
  POST_SUMMARY_MAX_WORDS,
} from '@shinefold/config/constants';
import {
  boldDecorator,
  italicDecorator,
} from '@shinefold/studio/schema-types/portable-text/decorators/decorators';
import { normalBlockStyle } from '@shinefold/studio/schema-types/portable-text/listed-text/listed-text';
import { validateMaxWords } from '@shinefold/studio/schema-types/validation/validate-max-words/validate-max-words';
import {
  countBlockWords,
  type TTextBlock,
} from '@shinefold/utils/portable-text';
import { defineArrayMember, defineField, defineType } from 'sanity';

const SET_BY_PIPELINE_DESCRIPTION = 'Set by the summary pipeline.';

export const postTakeawaysSchema = defineType({
  name: 'postTakeaways',
  title: 'Summary',
  type: 'object',
  description:
    'A short summary readers open from the post page, generated for you to review.',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'array',
      description:
        'Readers see exactly this. Write it as prose, and use a list only where the post lists things.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [normalBlockStyle],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [boldDecorator, italicDecorator],
            annotations: [],
          },
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .max(POST_SUMMARY_MAX_BLOCKS)
          .custom(validateMaxWords(POST_SUMMARY_MAX_WORDS)),
    }),
    defineField({
      name: 'generatedAt',
      title: 'Generated At',
      type: 'datetime',
      description: SET_BY_PIPELINE_DESCRIPTION,
      readOnly: true,
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      description: SET_BY_PIPELINE_DESCRIPTION,
      readOnly: true,
    }),
  ],
  preview: {
    select: { summary: 'summary' },
    prepare({ summary }: { summary?: TTextBlock[] }) {
      const words = countBlockWords(summary ?? []);

      return {
        title: 'Summary',
        subtitle: words > 0 ? `${String(words)} words` : 'No summary yet',
      };
    },
  },
});
