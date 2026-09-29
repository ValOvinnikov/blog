import type {
  ILink,
  ISanityImage,
  TBrandVariantOf,
  TContentAlignmentOf,
  TDisplayMode,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TLogoItem = {
  id: string;
  name: string;
  image: ISanityImage;
  link: TMaybeUndefined<ILink>;
};

export type TLogoWallModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  logos: TLogoItem[];
  ctaButtons: TCtaButton[];
  displayMode: TDisplayMode;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TLayout>;
};
