import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TWideLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

export type TSectionPagesModuleDocument = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
