import { articleTextSchema } from '@shinefold/studio/schema-types/portable-text/article-text/article-text';
import { headingTextSchema } from '@shinefold/studio/schema-types/portable-text/heading-text/heading-text';
import { listedTextSchema } from '@shinefold/studio/schema-types/portable-text/listed-text/listed-text';
import { paragraphTextSchema } from '@shinefold/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { defineField } from 'sanity';

export const LOCALIZED_FIELD_TYPES = [
  'string',
  defineField({ name: 'text', type: 'text', rows: 3 }),
  listedTextSchema.name,
  paragraphTextSchema.name,
  articleTextSchema.name,
  headingTextSchema.name,
];
