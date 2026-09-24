'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
  TCardImageShape,
} from '@blog/config';
import type { TFeatureListItem } from '@blog/service';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';

import { FeatureListCard } from './feature-list-card';

export interface IFeatureListCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TFeatureListItem[];
  imageShape: TCardImageShape;
  align: 'left' | 'center';
  imageSizes: string;
  title: string;
  tone?: TBrandVariant;
}

export const FeatureListCarousel = ({
  items,
  imageShape,
  align,
  imageSizes,
  title,
  tone,
  className,
  dataTestId,
}: IFeatureListCarouselProps) => (
  <LabelledCarousel
    items={items}
    renderItem={({ item }) => (
      <FeatureListCard
        item={item}
        imageShape={imageShape}
        align={align}
        imageSizes={imageSizes}
        headingLevel={3}
      />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    tone={tone}
    className={className}
    dataTestId={dataTestId}
  />
);
