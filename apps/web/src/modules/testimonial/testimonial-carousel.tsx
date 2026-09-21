'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import { useTranslations } from 'next-intl';

import { TestimonialCard, type TTestimonialCardItem } from './testimonial-card';

export interface ITestimonialCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TTestimonialCardItem[];
  align: 'left' | 'center';
  tone: TBrandVariant;
  title: string;
}

export const TestimonialCarousel = ({
  items,
  align,
  tone,
  title,
  className,
  dataTestId,
}: ITestimonialCarouselProps) => {
  const t = useTranslations('carousel');

  return (
    <Carousel
      items={items}
      renderItem={({ item }) => (
        <TestimonialCard item={item} align={align} tone={tone} />
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
