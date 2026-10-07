import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignmentOf,
  TMaybeUndefined,
  TMediaOrder,
  THeadingBlock,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';

export type TFeatureHighlightItem = {
  id: string;
  heading: string;
  body: TPortableTextBlock[];
  image: ISanityImage;
  action: TMaybeUndefined<TCtaButton>;
};

export type TFeatureHighlightsModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  highlights: TFeatureHighlightItem[];
  ctaButtons: TCtaButton[];
  mediaOrder: TMediaOrder;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
