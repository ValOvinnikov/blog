import type { TMaybeNull } from '@blog/config';
import { useMemo, useRef, type RefObject } from 'react';

/** Spans the trigger's width and the bar's height, so a popup placed below it clears the whole bar. */
export const useBarAnchor = (barRef: RefObject<TMaybeNull<HTMLElement>>) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const anchor = useMemo(
    () => ({
      get contextElement() {
        return triggerRef.current ?? undefined;
      },
      getBoundingClientRect: () => {
        const { x, width } =
          triggerRef.current?.getBoundingClientRect() ?? new DOMRect();
        const { y, height } =
          barRef.current?.getBoundingClientRect() ?? new DOMRect();

        return new DOMRect(x, y, width, height);
      },
    }),
    [barRef],
  );

  return { triggerRef, anchor };
};
