'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
  TCardImageShape,
} from '@blog/config';
import type { TFeatureListItem } from '@blog/service';
import { Carousel } from '@blog/ui/organisms/carousel';
import { useTranslations } from 'next-intl';

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
}: IFeatureListCarouselProps) => {
  const t = useTranslations('carousel');

  return (
    <Carousel
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
      ariaLabel={t('regionLabel', { title })}
      previousLabel={t('previousAriaLabel')}
      nextLabel={t('nextAriaLabel')}
      tone={tone}
      className={className}
      dataTestId={dataTestId}
    />
  );
};
