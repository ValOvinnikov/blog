import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  TNewsletterVariant,
} from '@blog/config';
import type { TRequiredHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';

export type TNewsletterModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TRequiredHeadingBlock;
  variant: TNewsletterVariant;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
};
