import type {
  TBrandVariant,
  TContentAlignmentOf,
  TDisplayMode,
  TMaybeUndefined,
  THeadingBlock,
} from '@shinefold/config';
import type { TWideLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

export type TPostRelatedModuleDocument = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  limit: number;
  layout: TMaybeUndefined<TWideLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  showImages: boolean;
  displayMode?: TDisplayMode;
};
