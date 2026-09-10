import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import type { ReactNode } from 'react';

import { carouselVariants, type TCarouselVariants } from './carousel-variants';
import { useCarousel } from './use-carousel';

export type TCarouselProps<T> = IWithClassName &
  IWithDataTestId & {
    /** The items to render as slides. */
    items: T[];
    /** Renders one item's slide content. */
    renderItem: (item: T, index: number) => ReactNode;
    ariaLabel: string;
    previousLabel: string;
    nextLabel: string;
    slideSize?: TCarouselVariants['slideSize'];
  };

/**
 * Carousel — a generic swipeable row of slides. A native scroll-snap track
 * before hydration, handed off to Embla once it mounts, with previous/next
 * buttons that always render. A slide is whatever `renderItem` returns; the
 * organism never maps data or names a content type.
 */
export const Carousel = <T,>({
  items,
  renderItem,
  ariaLabel,
  previousLabel,
  nextLabel,
  slideSize,
  className,
  dataTestId,
}: TCarouselProps<T>) => {
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

  const s = carouselVariants({ isEnhanced, slideSize });

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
            <li key={index} className={s.slide()}>
              {renderItem(item, index)}
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
        >
          <Icon name={ICONS.CHEVRON_LEFT} size={SIZE.SM} />
        </IconButton>
        <IconButton
          ref={nextButtonRef}
          ariaLabel={nextLabel}
          title={nextLabel}
          onClick={scrollNext}
          isDisabled={isNextDisabled}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
    </div>
  );
};
