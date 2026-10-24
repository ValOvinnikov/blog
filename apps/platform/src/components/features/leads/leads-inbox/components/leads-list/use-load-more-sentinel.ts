import { useEffect, useEffectEvent, useRef } from 'react';

// Starts the next page while a screen or so of rows is still left to read.
const PRELOAD_MARGIN = '400px';

type TUseLoadMoreSentinelInput = {
  isEnabled: boolean;
  loadedCount: number;
  onReach: () => void;
};

export const useLoadMoreSentinel = ({
  isEnabled,
  loadedCount,
  onReach,
}: TUseLoadMoreSentinelInput) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleReach = useEffectEvent(onReach);

  useEffect(() => {
    const node = ref.current;
    if (!isEnabled || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          handleReach();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isEnabled, loadedCount]);

  return ref;
};
