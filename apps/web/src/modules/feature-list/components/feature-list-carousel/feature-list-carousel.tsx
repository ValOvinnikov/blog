'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TCardImageShape,
} from '@shinefold/config';
import type { TFeatureListItem } from '@shinefold/service';
import type { ICarouselProps } from '@shinefold/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { FeatureListCard } from '@web/modules/feature-list/components/feature-list-card/feature-list-card';

export interface IFeatureListCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TFeatureListItem[];
  imageShape: TCardImageShape;
  align: 'left' | 'center';
  imageSizes: string;
  title: string;
  contentAlignment?: ICarouselProps<TFeatureListItem>['contentAlignment'];
  hasAnyImage?: boolean;
}

export const FeatureListCarousel = ({
  items,
  imageShape,
  align,
  imageSizes,
  title,
  contentAlignment,
  hasAnyImage,
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
        hasAnyImage={hasAnyImage}
      />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
