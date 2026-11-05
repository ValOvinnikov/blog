import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { DEVICE_FRAME_TEST_ID } from '@platform/constants/device-frame';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import type { TPreviewDevice } from '@platform/constants/preview';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useEffect, useRef, useState } from 'react';

const VIEWPORT_SELECTOR = `[data-testid="${DEVICE_FRAME_TEST_ID.VIEWPORT}"]`;

export const useFrameAvailableHeight = (device: TPreviewDevice) => {
  const rootRef = useRef<TMaybeNull<HTMLDivElement>>(null);
  const stageRef = useRef<TMaybeNull<HTMLDivElement>>(null);
  const root = useElementSize(rootRef);
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
      const next = Math.max(
        0,
        Math.floor(
          window.innerHeight -
            stageRect.top -
            stageChrome -
            belowStage -
            LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_HEIGHT -
            LOOK_LAYOUT_LIMIT.DOCKED_SAVE_BAR_CLEARANCE,
        ),
      );
      setAvailableHeight((previous) => (previous === next ? previous : next));
    };

    measure();
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, [device, root?.height, stage?.width, stage?.height]);

  return { rootRef, stageRef, availableHeight };
};
