'use client';

import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { TLogoItem } from '@shinefold/service';
import type { ICarouselProps } from '@shinefold/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { LogoWallTile } from '@web/modules/logo-wall/components/logo-wall-tile/logo-wall-tile';

export interface ILogoWallCarouselProps
  extends IWithClassName, IWithDataTestId {
  logos: TLogoItem[];
  title: string;
  contentAlignment?: ICarouselProps<TLogoItem>['contentAlignment'];
}

export const LogoWallCarousel = ({
  logos,
  title,
  contentAlignment,
  className,
  dataTestId,
}: ILogoWallCarouselProps) => (
  <LabelledCarousel
    items={logos}
    renderItem={({ item }) => <LogoWallTile logo={item} />}
    getItemKey={({ item }) => item.id}
    title={title}
    slideSize="content"
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
