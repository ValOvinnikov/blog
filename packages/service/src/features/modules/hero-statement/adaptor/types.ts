import type {
  ISanityImage,
  TContentAlignment,
  TFullBrandVariant,
  THeadingBlock,
  THeroVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';
import type { TCtaAction } from '@blog/service/shared/transformers/to-cta-action';

export type THeroStatementModule = {
  brandVariant: TFullBrandVariant;
  variant: THeroVariant;
  headingBlock: THeadingBlock;
  eyebrow: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  actions: TMaybeUndefined<readonly TCtaAction[]>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mediaOrder: TMaybeUndefined<TMediaOrder>;
  layout: TMaybeUndefined<TLayout>;
};
