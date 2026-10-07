import type {
  TBrandVariant,
  TContentAlignmentOf,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type TPostRelatedModuleDocument = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  limit: number;
  layout: TMaybeUndefined<TWideLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  showImages: boolean;
};
