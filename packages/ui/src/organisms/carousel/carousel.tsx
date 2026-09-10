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
  useRef,
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
  const regionRef = useRef<HTMLDivElement>(null);
  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const updateDisabledState = useCallback((api: EmblaCarouselType) => {
    const nextIsPreviousDisabled = !api.canScrollPrev();
    const nextIsNextDisabled = !api.canScrollNext();

    // A button about to become `disabled` is moved off of first, while it
    // can still take focus — disabling a focused native button drops focus
    // to <body>, which a later effect can't undo without a visible jump.
    if (
      nextIsPreviousDisabled &&
      document.activeElement === previousButtonRef.current
    ) {
      (nextIsNextDisabled ? regionRef : nextButtonRef).current?.focus();
    } else if (
      nextIsNextDisabled &&
      document.activeElement === nextButtonRef.current
    ) {
      (nextIsPreviousDisabled ? regionRef : previousButtonRef).current?.focus();
    }

    setIsPreviousDisabled(nextIsPreviousDisabled);
    setIsNextDisabled(nextIsNextDisabled);
  }, []);

  useEffect(() => {
    if (!embla) return;

    // `init` is emitted on a macrotask (a `setTimeout` inside Embla's own
    // engine), so a `.on('init', …)` subscribed here would race React's own
    // effect scheduling rather than reliably catch it — doing this work
    // eagerly, the first time `embla` is defined, is deterministic instead.
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

    // isEnhanced must not flip to `overflow-hidden` until after the
    // scrollLeft handoff above has repositioned the track — deriving it
    // straight from `embla` would apply that class in the same render Embla
    // becomes available, one render before this handoff has run.
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
          ref={previousButtonRef}
          ariaLabel={previousLabel}
          title={previousLabel}
          onClick={() => embla?.scrollPrev()}
          isDisabled={isPreviousDisabled}
        >
          <Icon name={ICONS.CHEVRON_LEFT} size={SIZE.SM} />
        </IconButton>
        <IconButton
          ref={nextButtonRef}
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
