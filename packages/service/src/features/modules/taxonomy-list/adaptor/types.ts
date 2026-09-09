import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
  TTaxonomyKind,
} from '@blog/config';
import type { TTagWithPostCount } from '@blog/service/features/entities/tags/adaptor/types';
import type { TTopicWithPostCount } from '@blog/service/features/entities/topics/adaptor/types';

/**
 * `TTopicWithPostCount` and `TTagWithPostCount` are structurally identical
 * (`{ id, title, slug, description, postCount }`) by design — one card
 * renders either.
 */
export type TTaxonomyEntry = TTopicWithPostCount | TTagWithPostCount;

export type TTaxonomyListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  taxonomy: TTaxonomyKind;
  entries: TTaxonomyEntry[];
};
