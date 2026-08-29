import type {
  BasicText,
  ILink,
  ISanityImage,
  TBrandVariantOf,
  TCtaActionAppearance,
  TCtaActionVariant,
  TCtaImageSide,
  TCtaMobileMediaOrder,
  TCtaVariant,
  THeadingAlign,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TCtaAction = {
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  link: ILink;
};

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY' | 'BRAND_PRIMARY'>;
  eyebrow: TMaybeUndefined<string>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
    align: TMaybeUndefined<THeadingAlign>;
  };
  content: TMaybeUndefined<BasicText>;
  image: TMaybeUndefined<ISanityImage>;
  imageSide: TMaybeUndefined<TCtaImageSide>;
  mobileMediaOrder: TMaybeUndefined<TCtaMobileMediaOrder>;
  actions: TCtaAction[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
