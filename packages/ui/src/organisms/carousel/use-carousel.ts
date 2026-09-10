import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Owns the Embla instance behind `Carousel` — the enhancement state, the
 * previous/next disabled flags, the scroll-position handoff on mount, and
 * the focus handling that keeps a disabling nav button from dropping focus.
 */
export const useCarousel = () => {
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

  return {
    isEnhanced,
    isPreviousDisabled,
    isNextDisabled,
    viewportRef,
    regionRef,
    previousButtonRef,
    nextButtonRef,
    scrollPrev: () => embla?.scrollPrev(),
    scrollNext: () => embla?.scrollNext(),
  };
};
