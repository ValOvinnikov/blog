import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import { flattenChildren } from '@blog/ui/lib/react';
import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import {
  isValidElement,
  useCallback,
  useEffect,
  useState,
  type Key,
  type ReactNode,
} from 'react';

import { carouselVariants, type TCarouselVariants } from './carousel-variants';

export type TCarouselProps = IWithClassName &
  IWithDataTestId & {
    /** The slides — every child becomes a list item in the track. */
    children: ReactNode;
    ariaLabel: string;
    previousLabel: string;
    nextLabel: string;
    slideSize?: TCarouselVariants['slideSize'];
  };

/**
 * Carousel — a generic swipeable row of slides. A native scroll-snap track
 * before hydration, handed off to Embla once it mounts, with previous/next
 * buttons that always render. A slide is whatever the caller passes; the
 * organism never maps data or names a content type.
 */
export const Carousel = ({
  children,
  ariaLabel,
  previousLabel,
  nextLabel,
  slideSize,
  className,
  dataTestId,
}: TCarouselProps) => {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isPreviousDisabled, setIsPreviousDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });

  const updateDisabledState = useCallback((api: EmblaCarouselType) => {
    setIsPreviousDisabled(!api.canScrollPrev());
    setIsNextDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!embla) return;

    // Embla fires `init` synchronously while constructing the instance,
    // before this effect can subscribe to it — so the first render where
    // `embla` is defined already IS init, handled here instead.
    const viewport = embla.rootNode();
    const scrollLeft = viewport.scrollLeft;
    viewport.scrollLeft = 0;

    const slides = embla.slideNodes();
    const start = slides[0]?.offsetLeft ?? 0;
    const distances = slides.map((slide) =>
      Math.abs(slide.offsetLeft - start - scrollLeft),
    );
    const index =
      distances.length > 0 ? distances.indexOf(Math.min(...distances)) : 0;
    embla.scrollTo(index, true);

    // Embla is already mounted by the time this effect runs, so the initial
    // enhanced/disabled state has no earlier subscribable event to react to.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEnhanced(true);
    updateDisabledState(embla);

    embla.on('select', updateDisabledState);
    embla.on('reInit', updateDisabledState);

    return () => {
      embla.off('select', updateDisabledState);
      embla.off('reInit', updateDisabledState);
    };
  }, [embla, updateDisabledState]);

  const s = carouselVariants({ isEnhanced, slideSize });

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
          {flattenChildren(children).map((slide, i) => {
            const key: Key =
              isValidElement(slide) && slide.key != null ? slide.key : i;
            return (
              <li key={key} className={s.slide()}>
                {slide}
              </li>
            );
          })}
        </ul>
      </div>
      <div className={s.controls()}>
        <IconButton
          ariaLabel={previousLabel}
          title={previousLabel}
          onClick={() => embla?.scrollPrev()}
          isDisabled={isPreviousDisabled}
        >
          <Icon name={ICONS.CHEVRON_LEFT} size={SIZE.SM} />
        </IconButton>
        <IconButton
          ariaLabel={nextLabel}
          title={nextLabel}
          onClick={() => embla?.scrollNext()}
          isDisabled={isNextDisabled}
        >
          <Icon name={ICONS.CHEVRON_RIGHT} size={SIZE.SM} />
        </IconButton>
      </div>
    </div>
  );
};
