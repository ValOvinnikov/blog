import type {
  TBrandVariant,
  TContentAlignmentOf,
  TMaybeUndefined,
  THeadingBlock,
  TTaxonomyKind,
} from '@blog/config';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';

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
  layout: TMaybeUndefined<TWideLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  taxonomy: TMaybeUndefined<TTaxonomyKind>;
  showLatestPosts: boolean;
  entries: TTaxonomyEntry[];
};
