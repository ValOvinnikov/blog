import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useSyncExternalStore } from 'react';

export const useCarousel = () => {
  const [viewportRef, embla] = useEmblaCarousel({
    align: 'start',
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!embla) return () => {};

      embla.on('select', onChange);
      embla.on('reInit', onChange);

      return () => {
        embla.off('select', onChange);
        embla.off('reInit', onChange);
      };
    },
    [embla],
  );

  const canScrollPrev = useSyncExternalStore(
    subscribe,
    () => embla?.canScrollPrev() ?? false,
    () => false,
  );
  const canScrollNext = useSyncExternalStore(
    subscribe,
    () => embla?.canScrollNext() ?? false,
    () => false,
  );

  return {
    canScrollPrev,
    canScrollNext,
    viewportRef,
    scrollPrev: () => embla?.scrollPrev(),
    scrollNext: () => embla?.scrollNext(),
  };
};
