import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
  TTaxonomyKind,
} from '@blog/config';

export type TPostLink = {
  id: string;
  title: string;
  slug: string;
};

/**
 * A resolved taxonomy term (topic or tag) as rendered by the module — the two
 * entities are structurally identical here (`{ id, title, slug, description,
 * postCount, latestPosts }`) by design, so one card renders either.
 */
export type TTaxonomyEntry = {
  id: string;
  title: string;
  slug: string;
  description: TMaybeUndefined<string>;
  postCount: number;
  latestPosts: TPostLink[];
};

export type TTaxonomyListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  taxonomy: TTaxonomyKind;
  showLatestPosts: boolean;
  entries: TTaxonomyEntry[];
};
