import type {
  ILink,
  TBrandVariantOf,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TCtaModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
    align: TMaybeUndefined<THeadingAlign>;
  };
  action: TMaybeUndefined<ILink>;
  layout: TMaybeUndefined<TLayout>;
};
