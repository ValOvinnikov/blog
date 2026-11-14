import type {
  ILink,
  ISanityImage,
  TBrandVariant,
  TCardImageShape,
  TContentAlignmentOf,
  TDisplayMode,
  TFeatureIconName,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TModuleAppearance } from '@blog/service/shared/transformers/module/to-module-appearance';

export type TFeatureListItem = {
  id: string;
  headingBlock: THeadingBlock;
  sanityImage: TMaybeUndefined<ISanityImage>;
  icon: TMaybeUndefined<TFeatureIconName>;
  link: TMaybeUndefined<ILink>;
};

export type TFeatureListModule = TModuleAppearance & {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  items: TFeatureListItem[];
  ctaButtons: TCtaButton[];
  imageShape: TCardImageShape;
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  cardAlignment: TContentAlignmentOf<'LEFT' | 'CENTER'>;
  layout: TMaybeUndefined<TWideLayout>;
};
