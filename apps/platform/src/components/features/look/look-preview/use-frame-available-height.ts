import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import {
  PREVIEW_DEVICE_HEIGHT,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useEffect, useRef, useState } from 'react';

type TUseFrameAvailableHeightOptions = {
  device: TPreviewDevice;
  scale: number;
};

export const useFrameAvailableHeight = ({
  device,
  scale,
}: TUseFrameAvailableHeightOptions) => {
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
      const stageRect = stageElement.getBoundingClientRect();
      if (stageRect.height === 0) {
        return;
      }
      const viewportHeight = Math.round(PREVIEW_DEVICE_HEIGHT[device] * scale);
      const stageChrome = stageRect.height - viewportHeight;
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
  }, [device, scale, root?.height, stage?.width, stage?.height]);

  return { rootRef, stageRef, availableHeight };
};
