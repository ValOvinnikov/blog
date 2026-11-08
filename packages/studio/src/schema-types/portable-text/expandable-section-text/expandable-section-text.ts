import {
  articleTextEmbeds,
  articleTextMarks,
  expandableSectionTextStyles,
} from '@blog/studio/schema-types/portable-text/article-text/article-text-members';
import { defineArrayMember, defineType } from 'sanity';

export const expandableSectionTextSchema = defineType({
  name: 'expandableSectionText',
  title: 'Expandable Section Text',
  type: 'array',
  description:
    'The content of an expandable section — article text whose headings stay below the page’s own sections, so its contents list stays accurate.',
  of: [
    defineArrayMember({
      type: 'block',
      styles: expandableSectionTextStyles,
      marks: articleTextMarks,
    }),
    ...articleTextEmbeds,
  ],
});
