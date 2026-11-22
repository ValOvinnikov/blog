'use client';

import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import {
  Carousel,
  type ICarouselProps,
} from '@shinefold/ui/components/organisms/carousel';
import { useTranslations } from 'next-intl';
import type { Key, ReactNode } from 'react';

export interface ILabelledCarouselProps<T>
  extends IWithClassName, IWithDataTestId {
  items: readonly T[];
  renderItem: (args: { item: T; index: number }) => ReactNode;
  getItemKey?: (args: { item: T; index: number }) => Key;
  title: string;
  slideSize?: ICarouselProps<T>['slideSize'];
  contentAlignment?: ICarouselProps<T>['contentAlignment'];
}

/**
 * Every caller has to be a Client Component: `renderItem` is a function
 * prop, which can never cross the server→client boundary.
 */
export const LabelledCarousel = <T,>({
  items,
  renderItem,
  getItemKey,
  title,
  slideSize,
  contentAlignment,
  className,
  dataTestId,
}: ILabelledCarouselProps<T>) => {
  const t = useTranslations('carousel');

  return (
    <Carousel
      items={items}
      renderItem={renderItem}
      getItemKey={getItemKey}
      ariaLabel={t('regionLabel', { title })}
      previousLabel={t('previousAriaLabel')}
      nextLabel={t('nextAriaLabel')}
      slideSize={slideSize}
      contentAlignment={contentAlignment}
      className={className}
      dataTestId={dataTestId}
    />
  );
};
