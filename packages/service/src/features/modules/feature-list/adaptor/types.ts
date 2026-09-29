import type {
  ILink,
  ISanityImage,
  TBrandVariantOf,
  TCardImageShape,
  TContentAlignment,
  TContentAlignmentOf,
  TDisplayMode,
  TFeatureIconName,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TFeatureListItem = {
  id: string;
  headingBlock: THeadingBlock;
  sanityImage: TMaybeUndefined<ISanityImage>;
  icon: TMaybeUndefined<TFeatureIconName>;
  link: TMaybeUndefined<ILink>;
};

export type TFeatureListModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  items: TFeatureListItem[];
  ctaButtons: TCtaButton[];
  imageShape: TCardImageShape;
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  cardAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  layout: TMaybeUndefined<TLayout>;
};
