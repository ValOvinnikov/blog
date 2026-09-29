'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import type { TLogoItem } from '@blog/service';
import {
  LabelledCarousel,
  type ILabelledCarouselProps,
} from '@web/components/shared/labelled-carousel';
import { LogoWallTile } from '@web/modules/logo-wall/components/logo-wall-tile/logo-wall-tile';

export interface ILogoWallCarouselProps
  extends IWithClassName, IWithDataTestId {
  logos: TLogoItem[];
  title: string;
  tone?: TBrandVariant;
  contentAlignment?: ILabelledCarouselProps<TLogoItem>['contentAlignment'];
}

export const LogoWallCarousel = ({
  logos,
  title,
  tone,
  contentAlignment,
  className,
  dataTestId,
}: ILogoWallCarouselProps) => (
  <LabelledCarousel
    items={logos}
    renderItem={({ item }) => <LogoWallTile logo={item} />}
    getItemKey={({ item }) => item.id}
    title={title}
    tone={tone}
    slideSize="content"
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
