import type { TValueOf } from '@blog/config/utils';

export const TAXONOMY_KIND = {
  TOPICS: 'TOPICS',
  TAGS: 'TAGS',
} as const;

export type TTaxonomyKind = TValueOf<typeof TAXONOMY_KIND>;

export const TAXONOMY_SORT = {
  ALPHABETICAL: 'ALPHABETICAL',
  MOST_POSTS: 'MOST_POSTS',
} as const;

export type TTaxonomySort = TValueOf<typeof TAXONOMY_SORT>;
