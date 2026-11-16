import type {
  ILink,
  ISanityImage,
  TBrandVariant,
  TContentAlignmentOf,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@shinefold/config';
import type { TCtaButton } from '@shinefold/service/shared/transformers/cta/to-cta-button';

export type TLogoItem = {
  id: string;
  name: string;
  image: ISanityImage;
  imageDark: TMaybeUndefined<ISanityImage>;
  link: TMaybeUndefined<ILink>;
};

export type TLogoWallModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  logos: TLogoItem[];
  ctaButtons: TCtaButton[];
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TLayout>;
};
