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
  /** The items to render as slides. */
  items: readonly T[];
  /** Renders one item's slide content. */
  renderItem: (args: { item: T; index: number }) => ReactNode;
  /** Returns a slide's React key; falls back to its index when omitted. */
  getItemKey?: (args: { item: T; index: number }) => Key;
  /** Layout only, applied to every slide — the caller sizes it. */
  slideClassName?: string;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  /** Section-ground hover for the nav buttons. Defaults to `PRIMARY`. */
  tone?: TBrandVariant;
}

/**
 * Carousel — a generic swipeable row of slides. A native scroll-snap track
 * before hydration, handed off to Embla once it mounts, with previous/next
 * buttons that always render. A slide is whatever `renderItem` returns and
 * is sized by `slideClassName`; the organism never maps data, names a
 * content type, or sets a slide width of its own.
 */
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
