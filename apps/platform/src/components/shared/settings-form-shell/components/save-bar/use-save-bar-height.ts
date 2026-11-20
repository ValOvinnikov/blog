import { SAVE_BAR_HEIGHT_PROPERTY } from '@platform/constants/settings-form';
import type { TMaybeNull } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { type RefObject, useEffect } from 'react';

// The bar's room grows the page without scrolling it, so a control edited at the page's end would sit under the bar.
const revealFocusedControl = () => {
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused !== document.body) {
    focused.scrollIntoView({ block: 'nearest' });
  }
};

// Publishes the visible bar's height on <html>, where the page's bottom room and scroll padding read it.
export const useSaveBarHeight = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
  isDirty: boolean,
) => {
  useEffect(() => {
    const root = document.documentElement;
    const bar = barRef.current;

    const measure = () => {
      const height = bar?.offsetHeight ?? 0;
      if (height > 0) {
        root.style.setProperty(SAVE_BAR_HEIGHT_PROPERTY, `${height}px`);
      } else {
        root.style.removeProperty(SAVE_BAR_HEIGHT_PROPERTY);
      }
    };

    measure();
    if (isDirty) revealFocusedControl();
    const observer = new ResizeObserver(measure);
    if (!isNull(bar)) observer.observe(bar);

    return () => {
      observer.disconnect();
      root.style.removeProperty(SAVE_BAR_HEIGHT_PROPERTY);
    };
  }, [barRef, isDirty]);
};
