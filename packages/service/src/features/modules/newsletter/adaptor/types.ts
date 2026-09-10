import type {
  TBrandVariantOf,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  TNewsletterVariant,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
  };
  variant: TNewsletterVariant;
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
};
