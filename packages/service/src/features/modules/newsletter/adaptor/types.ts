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
    align: TMaybeUndefined<THeadingAlign>;
  };
  layout: TMaybeUndefined<TLayout>;
};
