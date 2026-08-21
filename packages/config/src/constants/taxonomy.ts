import type { TValueOf } from '@blog/config/utils';

/** The two taxonomy kinds a `module_taxonomyList` slot can be asked to list. */
export const TAXONOMY_KIND = {
  TOPICS: 'TOPICS',
  TAGS: 'TAGS',
} as const;

export type TTaxonomyKind = TValueOf<typeof TAXONOMY_KIND>;
