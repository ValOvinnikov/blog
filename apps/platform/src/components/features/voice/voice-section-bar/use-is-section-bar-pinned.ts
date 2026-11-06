import type { TMaybeNull } from '@blog/config';
import { useLayoutMeasure } from '@platform/utils/use-layout-measure/use-layout-measure';
import { type RefObject, useRef, useState } from 'react';

export const useIsSectionBarPinned = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
): boolean => {
  const [isPinned, setIsPinned] = useState(false);
  const isPinnedRef = useRef(false);

  useLayoutMeasure(() => {
    const bar = barRef.current;
    if (!bar) return;
    const stickyTop = Number.parseFloat(getComputedStyle(bar).top);
    const next =
      Math.round(bar.getBoundingClientRect().top) <= Math.round(stickyTop);
    if (next === isPinnedRef.current) return;
    isPinnedRef.current = next;
    setIsPinned(next);
  }, barRef);

  return isPinned;
};
