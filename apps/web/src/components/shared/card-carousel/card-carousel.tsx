'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import type { ICarouselProps } from '@blog/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';

export interface ICardCarouselProps extends IWithClassName, IWithDataTestId {
  items: IMediaCardData[];
  hasImages?: boolean;
  title: string;
  tone?: TBrandVariant;
  contentAlignment?: ICarouselProps<IMediaCardData>['contentAlignment'];
}

export const CardCarousel = ({
  items,
  hasImages,
  title,
  tone,
  contentAlignment,
  className,
  dataTestId,
}: ICardCarouselProps) => (
  <LabelledCarousel
    items={items}
    renderItem={({ item }) => (
      <MediaCardItem item={item} hasImage={hasImages} />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    tone={tone}
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
