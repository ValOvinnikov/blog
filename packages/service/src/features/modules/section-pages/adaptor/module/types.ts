import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TWideLayout } from '@shinefold/service/shared/transformers/layout/to-layout';

export type TSectionPagesModuleDocument = {
  brandVariant: TBrandVariant;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
