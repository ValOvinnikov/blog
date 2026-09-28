import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

export const useCarousel = () => {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });

  const updateScrollableState = useCallback((api: EmblaCarouselType) => {
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!embla) return;

    embla.on('init', updateScrollableState);
    embla.on('select', updateScrollableState);
    embla.on('reInit', updateScrollableState);

    return () => {
      embla.off('init', updateScrollableState);
      embla.off('select', updateScrollableState);
      embla.off('reInit', updateScrollableState);
    };
  }, [embla, updateScrollableState]);

  return {
    canScrollPrev,
    canScrollNext,
    viewportRef,
    scrollPrev: () => embla?.scrollPrev(),
    scrollNext: () => embla?.scrollNext(),
  };
};
