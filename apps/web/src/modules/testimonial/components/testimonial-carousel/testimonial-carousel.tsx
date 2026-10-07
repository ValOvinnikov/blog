'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import type { TTestimonialItem } from '@blog/service';
import type { ICarouselProps } from '@blog/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { TestimonialCard } from '@web/modules/testimonial/components/testimonial-card/testimonial-card';

export interface ITestimonialCarouselProps
  extends IWithClassName, IWithDataTestId {
  items: TTestimonialItem[];
  align: 'left' | 'center';
  title: string;
  tone: TBrandVariant;
  contentAlignment?: ICarouselProps<TTestimonialItem>['contentAlignment'];
}

export const TestimonialCarousel = ({
  items,
  align,
  title,
  tone,
  contentAlignment,
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
    contentAlignment={contentAlignment}
    className={className}
    slideSize="stepped"
    dataTestId={dataTestId}
  />
);
