'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariantOf,
} from '@blog/config';
import type { TTestimonialItem } from '@blog/service';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';

import { TestimonialCard } from './testimonial-card';

export interface ITestimonialCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TTestimonialItem[];
  align: 'left' | 'center';
  title: string;
  tone: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
}

export const TestimonialCarousel = ({
  items,
  align,
  title,
  tone,
  className,
  dataTestId,
}: ITestimonialCarouselProps) => (
  <LabelledCarousel
    items={items}
    renderItem={({ item }) => (
      <TestimonialCard item={item} align={align} tone={tone} />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    tone={tone}
    className={className}
    dataTestId={dataTestId}
  />
);
