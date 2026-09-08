import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { mapCompoundSlots, type TCompoundComponent } from '@blog/ui/lib/react';
import type { ElementType, ReactNode, Ref } from 'react';

import { carouselVariants } from './carousel-variants';
import { CarouselControls } from './components/controls/carousel-controls';

const CarouselParts = {
  Controls: CarouselControls,
} satisfies Record<string, ElementType>;

export type TCarouselProps = IWithClassName &
  IWithDataTestId & {
    /** The slides — anything that isn't a `Carousel.Controls` element becomes one. */
    children: ReactNode;
    /** Forwarded to the viewport element — the node Embla binds to once hydrated. */
    viewportRef?: Ref<HTMLDivElement>;
    /**
     * Off (default, pre-hydration): a native scroll-snap track with a thin
     * scrollbar. On: Embla owns scrolling, so the viewport hides overflow
     * and drops snap and the scrollbar.
     */
    isEnhanced?: boolean;
    ariaLabel: string;
  };

/**
 * Carousel — a scroll-snap track of slides with a `Carousel.Controls` slot;
 * works as a native swipeable row before hydration and hands scrolling to
 * Embla once `isEnhanced` is set.
 */
const CarouselRoot = ({
  children,
  viewportRef,
  isEnhanced,
  ariaLabel,
  className,
  dataTestId,
}: TCarouselProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, CarouselParts);
  const s = carouselVariants({ isEnhanced });

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
          {unmatched.map((slide, i) => (
            <li key={i} className={s.slide()}>
              {slide}
            </li>
          ))}
        </ul>
      </div>
      {slots.Controls}
    </div>
  );
};

export const Carousel: TCompoundComponent<
  typeof CarouselRoot,
  typeof CarouselParts
> = Object.assign(CarouselRoot, CarouselParts);
