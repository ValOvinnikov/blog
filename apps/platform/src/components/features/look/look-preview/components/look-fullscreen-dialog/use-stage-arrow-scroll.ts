import type { TMaybeNull } from '@blog/config';
import type { TDeviceFrameHandle } from '@platform/components/shared/device-frame';
import { KEY } from '@platform/constants/keyboard';
import { LOOK_FULLSCREEN } from '@platform/constants/look-fullscreen';
import { useRef, type KeyboardEvent } from 'react';

const { SCROLL_STEP } = LOOK_FULLSCREEN;

const ARROW_SCROLL: Record<string, { left?: number; top?: number }> = {
  [KEY.ARROW_UP]: { top: -SCROLL_STEP },
  [KEY.ARROW_DOWN]: { top: SCROLL_STEP },
  [KEY.ARROW_LEFT]: { left: -SCROLL_STEP },
  [KEY.ARROW_RIGHT]: { left: SCROLL_STEP },
};

export const useStageArrowScroll = () => {
  const frameRef = useRef<TMaybeNull<TDeviceFrameHandle>>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = ARROW_SCROLL[event.key];
    if (!delta || event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    frameRef.current?.scrollBy(delta);
  };

  return { frameRef, onKeyDown };
};
