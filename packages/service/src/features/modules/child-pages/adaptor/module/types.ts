import type {
  TBrandVariantOf,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';
import type { TChildPageCard } from '@blog/service/features/modules/child-pages/adaptor/pages/types';

export type TChildPagesModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  pages: TChildPageCard[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
