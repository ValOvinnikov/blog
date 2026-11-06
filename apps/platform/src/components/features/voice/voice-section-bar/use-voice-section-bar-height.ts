import type { TMaybeNull } from '@blog/config';
import { VOICE_BAR_HEIGHT_PROPERTY } from '@platform/constants/voice';
import { type RefObject, useLayoutEffect } from 'react';

// A layout effect, so the first-load hash scroll in a parent's passive effect already reads the height.
export const useVoiceSectionBarHeight = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
) => {
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty(
        VOICE_BAR_HEIGHT_PROPERTY,
        `${bar.offsetHeight}px`,
      );
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(bar);

    return () => {
      observer.disconnect();
      root.style.removeProperty(VOICE_BAR_HEIGHT_PROPERTY);
    };
  }, [barRef]);
};
