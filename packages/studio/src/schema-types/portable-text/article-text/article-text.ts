import { expandableSectionSchema } from '@blog/studio/schema-types/objects/expandable-section/expandable-section';
import {
  articleTextEmbeds,
  articleTextMarks,
  articleTextStyles,
} from '@blog/studio/schema-types/portable-text/article-text/article-text-members';
import { defineArrayMember, defineType } from 'sanity';

export const articleTextSchema = defineType({
  name: 'articleText',
  title: 'Article Text',
  type: 'array',
  description:
    'The main body of a post or content module, supporting headings, images, code blocks, and asides.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: articleTextStyles,
      marks: articleTextMarks,
    }),
    ...articleTextEmbeds,
    defineArrayMember({ type: expandableSectionSchema.name }),
  ],
});
