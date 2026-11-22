'use client';

import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ICarouselProps } from '@shinefold/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';

export interface ICardCarouselProps extends IWithClassName, IWithDataTestId {
  items: IMediaCardData[];
  hasImages?: boolean;
  title: string;
  contentAlignment?: ICarouselProps<IMediaCardData>['contentAlignment'];
}

export const CardCarousel = ({
  items,
  hasImages,
  title,
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
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
