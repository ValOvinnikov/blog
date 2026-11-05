import type { TMaybeNull } from '@blog/config';
import { isNull } from '@blog/utils/primitives';
import { type RefObject, useEffect } from 'react';

const SAVE_BAR_HEIGHT_PROPERTY = '--admin-save-bar-height';

// Publishes the visible bar's height on <html>, where the page's bottom room and scroll padding read it.
export const useSaveBarHeight = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
  phoneFooterRef: RefObject<TMaybeNull<HTMLElement>>,
  isDirty: boolean,
) => {
  useEffect(() => {
    const root = document.documentElement;
    const bars = [barRef.current, phoneFooterRef.current].filter(
      (bar): bar is HTMLElement => !isNull(bar),
    );

    const measure = () => {
      const height = Math.max(0, ...bars.map((bar) => bar.offsetHeight));
      if (height > 0) {
        root.style.setProperty(SAVE_BAR_HEIGHT_PROPERTY, `${height}px`);
      } else {
        root.style.removeProperty(SAVE_BAR_HEIGHT_PROPERTY);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    bars.forEach((bar) => observer.observe(bar));

    return () => {
      observer.disconnect();
      root.style.removeProperty(SAVE_BAR_HEIGHT_PROPERTY);
    };
  }, [barRef, phoneFooterRef, isDirty]);
};
