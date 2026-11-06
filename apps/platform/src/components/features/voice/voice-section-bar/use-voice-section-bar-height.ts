import type { TMaybeNull } from '@blog/config';
import { type RefObject, useEffect } from 'react';

const VOICE_BAR_HEIGHT_PROPERTY = '--admin-voice-bar-height';

// Publishes the bar's height on <html>, where the sections' scroll margin and the sticky preview read it.
export const useVoiceSectionBarHeight = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
) => {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() =>
      root.style.setProperty(
        VOICE_BAR_HEIGHT_PROPERTY,
        `${bar.offsetHeight}px`,
      ),
    );
    observer.observe(bar);

    return () => {
      observer.disconnect();
      root.style.removeProperty(VOICE_BAR_HEIGHT_PROPERTY);
    };
  }, [barRef]);
};
