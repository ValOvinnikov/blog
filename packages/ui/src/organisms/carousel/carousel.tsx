import {
  BRAND_VARIANT,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import type { Key, ReactNode } from 'react';

import { carouselVariants } from './carousel-variants';
import { useCarousel } from './use-carousel';

export interface ICarouselProps<T> extends IWithClassName, IWithDataTestId {
  items: readonly T[];
  renderItem: (args: { item: T; index: number }) => ReactNode;
  getItemKey?: (args: { item: T; index: number }) => Key;
  slideClassName?: string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  tone?: TBrandVariant;
}

/** A generic swipeable row of slides. */
export const Carousel = <T,>({
  items,
  renderItem,
  getItemKey,
  slideClassName,
  ariaLabel,
  previousLabel,
  nextLabel,
  tone = BRAND_VARIANT.PRIMARY,
  className,
  dataTestId,
}: ICarouselProps<T>) => {
  const {
    isEnhanced,
    isPreviousDisabled,
    isNextDisabled,
    viewportRef,
    regionRef,
    previousButtonRef,
    nextButtonRef,
    scrollPrev,
    scrollNext,
  } = useCarousel();

  const s = carouselVariants({ isEnhanced });

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={className}
      data-testid={dataTestId}
    >
      <div ref={viewportRef} className={s.viewport()}>
        <ul role="list" className={s.track()}>
          {items.map((item, index) => (
            <li
              key={getItemKey ? getItemKey({ item, index }) : index}
              className={s.slide({ class: slideClassName })}
            >
              {renderItem({ item, index })}
            </li>
          ))}
        </ul>
      </div>
      <div className={s.controls()}>
        <IconButton
          ref={previousButtonRef}
          ariaLabel={previousLabel}
          title={previousLabel}
          onClick={scrollPrev}
          isDisabled={isPreviousDisabled}
          variant="control"
          tone={tone}
        >
          <Icon name={ICONS.CHEVRON_LEFT} size={SIZE.SM} />
        </IconButton>
        <IconButton
          ref={nextButtonRef}
          ariaLabel={nextLabel}
          title={nextLabel}
          onClick={scrollNext}
          isDisabled={isNextDisabled}
          variant="control"
          tone={tone}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
    </div>
  );
};
