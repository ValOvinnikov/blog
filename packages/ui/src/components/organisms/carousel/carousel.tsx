import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import type { Key, ReactNode } from 'react';

import { carouselVariants, type TCarouselVariants } from './carousel-variants';
import { hasOverflow, useCarousel } from './use-carousel';

export interface ICarouselProps<T> extends IWithClassName, IWithDataTestId {
  items: readonly T[];
  renderItem: (args: { item: T; index: number }) => ReactNode;
  getItemKey?: (args: { item: T; index: number }) => Key;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  tone?: TBrandVariant;
  slideSize?: TCarouselVariants['slideSize'];
  contentAlignment?: TCarouselVariants['alignment'];
}

/** Scrolls through a row of items, revealing more of them as the viewport widens. */
export const Carousel = <T,>({
  items,
  renderItem,
  getItemKey,
  ariaLabel,
  previousLabel,
  nextLabel,
  tone = BRAND_VARIANT.PRIMARY,
  slideSize = 'fraction',
  contentAlignment = CONTENT_ALIGNMENT.LEFT,
  className,
  dataTestId,
}: ICarouselProps<T>) => {
  const { canScrollPrev, canScrollNext, viewportRef, scrollPrev, scrollNext } =
    useCarousel();

  const alignment = hasOverflow(canScrollPrev, canScrollNext)
    ? CONTENT_ALIGNMENT.LEFT
    : contentAlignment;

  const s = carouselVariants({ slideSize, alignment });

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={className}
      data-testid={dataTestId}
    >
      <div ref={viewportRef} className={s.viewport()}>
        <ul role="list" className={s.track()}>
          {items.map((item, index) => (
            <li
              key={getItemKey ? getItemKey({ item, index }) : index}
              className={s.slide()}
            >
              {renderItem({ item, index })}
            </li>
          ))}
        </ul>
      </div>
      {(canScrollPrev || canScrollNext) && (
        <div className={s.controls()}>
          <IconButton
            ariaLabel={previousLabel}
            title={previousLabel}
            onClick={scrollPrev}
            isDisabled={!canScrollPrev}
            isFocusableWhenDisabled={true}
            variant="control"
            tone={tone}
          >
            <Icon name={ICONS.CHEVRON_LEFT} size={SIZE.SM} />
          </IconButton>
          <IconButton
            ariaLabel={nextLabel}
            title={nextLabel}
            onClick={scrollNext}
            isDisabled={!canScrollNext}
            isFocusableWhenDisabled={true}
            variant="control"
            tone={tone}
          >
            <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
          </IconButton>
        </div>
      )}
    </div>
  );
};
