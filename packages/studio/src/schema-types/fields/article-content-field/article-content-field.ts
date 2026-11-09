import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { defineField } from 'sanity';

export const articleContentField = (description: string) =>
  defineField({
    name: 'content',
    title: 'Content',
    type: articleTextSchema.name,
    description,
    validation: (rule) => rule.required(),
  });
