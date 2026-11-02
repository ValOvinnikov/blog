import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import { useImperativeHandle, type Ref, type RefObject } from 'react';

type TDeviceFrameScrollTarget =
  TValueOf<typeof DEVICE_FRAME_SCROLL_TARGET> | HTMLElement;

export type TDeviceFrameHandle = {
  scrollTo(target: TDeviceFrameScrollTarget, behavior?: ScrollBehavior): void;
  scrollBy(delta: { left?: number; top?: number }): void;
};

export const useDeviceFrameHandle = (
  ref: TMaybeUndefined<Ref<TDeviceFrameHandle>>,
  scrollerRef: RefObject<TMaybeNull<HTMLDivElement>>,
  contentRef: RefObject<TMaybeNull<HTMLDivElement>>,
) => {
  useImperativeHandle(ref, () => ({
    scrollTo: (target, behavior) => {
      const scroller = scrollerRef.current;
      const content = contentRef.current;
      if (!scroller || !content) {
        return;
      }

      if (target === DEVICE_FRAME_SCROLL_TARGET.TOP) {
        scroller.scrollTo({ top: 0, behavior });
      } else if (target === DEVICE_FRAME_SCROLL_TARGET.END) {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior });
      } else {
        const top =
          target.getBoundingClientRect().top -
          content.getBoundingClientRect().top;
        scroller.scrollTo({ top, behavior });
      }
    },
    scrollBy: (delta) => {
      scrollerRef.current?.scrollBy(delta);
    },
  }));
};
