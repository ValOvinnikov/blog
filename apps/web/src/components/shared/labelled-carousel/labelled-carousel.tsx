'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import { useTranslations } from 'next-intl';
import type { Key, ReactNode } from 'react';

export interface ILabelledCarouselProps<T>
  extends IWithClassName, IWithDataTestId {
  items: readonly T[];
  renderItem: (args: { item: T; index: number }) => ReactNode;
  getItemKey?: (args: { item: T; index: number }) => Key;
  title: string;
  tone?: TBrandVariant;
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
  tone,
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
      tone={tone}
      className={className}
      dataTestId={dataTestId}
    />
  );
};
