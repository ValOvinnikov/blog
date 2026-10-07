import type {
  TBrandVariant,
  TContentAlignment,
  TContentAlignmentOf,
  TLayout,
  TMaybeUndefined,
  THeadingBlock,
  TPortableTextBlock,
  TTimelineMarkerStyle,
  TTimelineOrientation,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TTimelineItem = {
  id: string;
  marker: TMaybeUndefined<string>;
  heading: string;
  body: TMaybeUndefined<TPortableTextBlock[]>;
};

export type TTimelineModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  markerStyle: TTimelineMarkerStyle;
  items: TTimelineItem[];
  orientation: TTimelineOrientation;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  itemAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  layout: TMaybeUndefined<TLayout>;
};
