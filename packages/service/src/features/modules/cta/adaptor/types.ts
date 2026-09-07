import type {
  BasicText,
  ILink,
  ISanityImage,
  TCtaActionAppearance,
  TCtaActionVariant,
  TContentAlignment,
  TCtaVariant,
  TFullBrandVariant,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
} from '@blog/config';

export type TCtaAction = {
  variant: TCtaActionVariant;
  appearance: TMaybeUndefined<TCtaActionAppearance>;
  link: ILink;
};

export type TCtaModule = {
  variant: TCtaVariant;
  brandVariant: TFullBrandVariant;
  bandTone: TFullBrandVariant;
  eyebrow: TMaybeUndefined<string>;
  sectionHeader: {
    heading: string;
    supportingText: TMaybeUndefined<string>;
  };
  content: TMaybeUndefined<BasicText>;
  image: TMaybeUndefined<ISanityImage>;
  contentPosition: TMaybeUndefined<TContentAlignment>;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  mobileMediaOrder: TMaybeUndefined<TMediaOrder>;
  actions: TCtaAction[];
  footnote: TMaybeUndefined<string>;
  layout: TMaybeUndefined<TLayout>;
};
