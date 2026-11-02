import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE_HEIGHT,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import {
  resolveDeviceFrameLayout,
  scaleDeviceSize,
  toScrollThumb,
  type TDeviceFrameFit,
} from '@platform/utils/device-frame-scale/device-frame-scale';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useEffect, useRef, useState, type Ref, type UIEvent } from 'react';

import {
  useDeviceFrameHandle,
  type TDeviceFrameHandle,
} from './use-device-frame-handle';

type TUseDeviceFrameOptions = {
  device: TPreviewDevice;
  fit: TDeviceFrameFit;
  onScaleChange?(scale: number): void;
  ref?: Ref<TDeviceFrameHandle>;
};

export const useDeviceFrame = ({
  device,
  fit,
  onScaleChange,
  ref,
}: TUseDeviceFrameOptions) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ left: 0, top: 0 });
  const stage = useElementSize(stageRef);
  const measuredViewport = useElementSize(viewportRef);
  const content = useElementSize(contentRef);
  const layout = resolveDeviceFrameLayout({
    device,
    fit,
    stageWidth: stage?.width,
  });
  const isMeasured = layout !== undefined;
  const { scale, isPanning, viewport } = layout ?? {
    scale: 1,
    isPanning: false,
    viewport: scaleDeviceSize(device, 1),
  };

  useEffect(() => {
    if (isMeasured) {
      onScaleChange?.(scale);
    }
  }, [isMeasured, scale, onScaleChange]);

  useDeviceFrameHandle(ref, scrollerRef, contentRef);

  const deviceWidth = PREVIEW_DEVICE_WIDTH[device];
  const sizer = {
    width: isPanning ? deviceWidth : viewport.width,
    height: Math.round(
      (content?.height ?? PREVIEW_DEVICE_HEIGHT[device]) * scale,
    ),
  };
  const viewportSize = {
    width: measuredViewport?.width ?? viewport.width ?? 0,
    height: measuredViewport?.height ?? viewport.height ?? 0,
  };

  return {
    stageRef,
    viewportRef,
    scrollerRef,
    contentRef,
    scale,
    isMeasured,
    isPanning,
    isFullscreen: fit.mode === DEVICE_FRAME_FIT.FULLSCREEN,
    viewport,
    viewportSize,
    sizer,
    verticalThumb: toScrollThumb({
      offset: offset.top,
      viewportSize: viewportSize.height,
      contentSize: sizer.height,
    }),
    horizontalThumb: isPanning
      ? toScrollThumb({
          offset: offset.left,
          viewportSize: viewportSize.width,
          contentSize: deviceWidth,
        })
      : null,
    onScroll: ({ currentTarget }: UIEvent<HTMLDivElement>) => {
      setOffset({
        left: currentTarget.scrollLeft,
        top: currentTarget.scrollTop,
      });
    },
  };
};
