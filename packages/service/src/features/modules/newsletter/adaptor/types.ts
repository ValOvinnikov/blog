import type {
  TBrandVariantOf,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
  };
  layout: TMaybeUndefined<TLayout>;
  contentAlignment: TMaybeUndefined<THeadingAlign>;
};
