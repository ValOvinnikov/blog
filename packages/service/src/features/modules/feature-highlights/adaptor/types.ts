import type {
  ISanityImage,
  TBrandVariant,
  TContentAlignment,
  TLayout,
  TMaybeUndefined,
  TMediaOrder,
  THeadingBlock,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

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
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
