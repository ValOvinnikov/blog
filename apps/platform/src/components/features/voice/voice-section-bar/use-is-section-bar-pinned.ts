import type { TMaybeNull } from '@blog/config';
import { useLayoutMeasure } from '@platform/utils/use-layout-measure/use-layout-measure';
import { type RefObject, useState } from 'react';

export const useIsSectionBarPinned = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
): boolean => {
  const [isPinned, setIsPinned] = useState(false);

  useLayoutMeasure(() => {
    const bar = barRef.current;
    if (!bar) return;
    const stickyTop = Number.parseFloat(getComputedStyle(bar).top);
    setIsPinned(
      Math.round(bar.getBoundingClientRect().top) <= Math.round(stickyTop),
    );
  }, barRef);

  return isPinned;
};
