import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  DEVICE_FRAME_LIMIT,
  DEVICE_FRAME_VIEWPORT_ATTRIBUTE,
} from '@platform/constants/device-frame';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import type { TPreviewDevice } from '@platform/constants/preview';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useEffect, useRef, useState } from 'react';

const VIEWPORT_SELECTOR = `[${DEVICE_FRAME_VIEWPORT_ATTRIBUTE}]`;

const DOCKED_SAVE_BAR_ROOM =
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_HEIGHT +
  LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_CLEARANCE;

const pageBottomPadding = (element: Element) => {
  let padding = 0;
  for (let node = element.parentElement; node; node = node.parentElement) {
    padding += parseFloat(getComputedStyle(node).paddingBottom) || 0;
  }
  return padding;
};

// The status line's height is read only when the frame re-fits, so a follow rewording it never rescales the frame.
export const useFrameAvailableHeight = (
  device: TPreviewDevice,
  isScrollingWithPage: boolean,
) => {
  const isHeightCapped = useMediaQuery(MEDIA_QUERY.LG_UP);
  const rootRef = useRef<TMaybeNull<HTMLDivElement>>(null);
  const stageRef = useRef<TMaybeNull<HTMLDivElement>>(null);
  const stage = useElementSize(stageRef);
  const [availableHeight, setAvailableHeight] =
    useState<TMaybeUndefined<number>>();

  useEffect(() => {
    const measure = () => {
      const rootElement = rootRef.current;
      const stageElement = stageRef.current;
      if (!rootElement || !stageElement) {
        return;
      }
      const viewportElement = stageElement.querySelector(VIEWPORT_SELECTOR);
      const stageRect = stageElement.getBoundingClientRect();
      if (!viewportElement || stageRect.height === 0) {
        return;
      }
      const stageChrome =
        stageRect.height - viewportElement.getBoundingClientRect().height;
      const belowStage =
        rootElement.getBoundingClientRect().bottom - stageRect.bottom;
      const stageTop = isScrollingWithPage
        ? stageRect.top + window.scrollY
        : stageRect.top;
      const bottomRoom = Math.max(
        pageBottomPadding(rootElement),
        isScrollingWithPage ? 0 : DOCKED_SAVE_BAR_ROOM,
      );
      const fitted = Math.max(
        0,
        Math.floor(
          window.innerHeight - stageTop - stageChrome - belowStage - bottomRoom,
        ),
      );
      const next = isHeightCapped
        ? Math.min(fitted, DEVICE_FRAME_LIMIT.PAGE_HEIGHT)
        : fitted;
      setAvailableHeight((previous) => (previous === next ? previous : next));
    };

    measure();
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, [
    device,
    isScrollingWithPage,
    isHeightCapped,
    stage?.width,
    stage?.height,
  ]);

  return { rootRef, stageRef, availableHeight };
};
