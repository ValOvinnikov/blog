'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
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
}

export const CardCarousel = ({
  items,
  hasImages,
  title,
  tone,
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
    className={className}
    dataTestId={dataTestId}
  />
);
