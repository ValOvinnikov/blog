import type {
  ILink,
  ISanityImage,
  TCardImageShape,
  TContentAlignment,
  TDisplayMode,
  TFeatureIconName,
  TFullBrandVariant,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/to-cta-button';

export type TFeatureListItem = {
  id: string;
  headingBlock: THeadingBlock;
  sanityImage: TMaybeUndefined<ISanityImage>;
  icon: TMaybeUndefined<TFeatureIconName>;
  link: TMaybeUndefined<ILink>;
};

export type TFeatureListModule = {
  brandVariant: TFullBrandVariant;
  headingBlock: THeadingBlock;
  items: TFeatureListItem[];
  ctaButtons: TCtaButton[];
  imageShape: TCardImageShape;
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  cardAlignment: TContentAlignment;
  layout: TMaybeUndefined<TLayout>;
};
