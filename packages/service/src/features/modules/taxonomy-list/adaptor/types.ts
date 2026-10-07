import type {
  TBrandVariant,
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

export type TTaxonomyEntry = {
  id: string;
  title: string;
  slug: TMaybeUndefined<string>;
  description: TMaybeUndefined<string>;
  postCount: number;
  latestPosts: TPostLink[];
};

export type TTaxonomyListModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  taxonomy: TMaybeUndefined<TTaxonomyKind>;
  showLatestPosts: boolean;
  entries: TTaxonomyEntry[];
};
