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
import { featureListCarouselVariants } from './feature-list-carousel-variants';

export interface IFeatureListCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TFeatureListItem[];
  imageShape: TCardImageShape;
  align: 'left' | 'center';
  imageSizes: string;
  title: string;
  tone?: TBrandVariant;
}

const s = featureListCarouselVariants();

/**
 * FeatureListCarousel — the `'use client'` wrapper that gives a row of
 * feature cards a swipeable carousel via `@blog/ui`'s `Carousel`.
 * `renderItem` is defined here rather than in a Server Component view
 * because a function prop can never cross the server→client boundary.
 */
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
      slideClassName={s.slide()}
      ariaLabel={t('regionLabel', { title })}
      previousLabel={t('previousAriaLabel')}
      nextLabel={t('nextAriaLabel')}
      tone={tone}
      className={className}
      dataTestId={dataTestId}
    />
  );
};
