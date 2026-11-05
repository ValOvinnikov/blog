import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import {
  DEVICE_FRAME_FIT,
  DEVICE_FRAME_LIMIT,
  DEVICE_FRAME_SIZE,
  type TDeviceFrameFitMode,
} from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';

export type TDeviceFrameFit = {
  mode: TDeviceFrameFitMode;
  availableHeight?: number;
};

export type TElementSize = { width: number; height: number };

export type TDeviceFrameLayout = {
  scale: number;
  isPanning: boolean;
  viewport: {
    width: TMaybeUndefined<number>;
    height: TMaybeUndefined<number>;
  };
};

export type TScrollThumb = { start: number; size: number };

const roundScale = (scale: number) =>
  Math.round(scale * DEVICE_FRAME_LIMIT.SCALE_PRECISION) /
  DEVICE_FRAME_LIMIT.SCALE_PRECISION;

export const scaleDeviceSize = (
  device: TPreviewDevice,
  scale: number,
): TElementSize => ({
  width: Math.round(PREVIEW_DEVICE_WIDTH[device] * scale),
  height: Math.round(PREVIEW_DEVICE_HEIGHT[device] * scale),
});

export const fitPageScale = ({
  device,
  availableWidth,
  availableHeight = DEVICE_FRAME_LIMIT.PAGE_HEIGHT,
}: {
  device: TPreviewDevice;
  availableWidth: number;
  availableHeight?: number;
}) =>
  roundScale(
    Math.max(
      0,
      Math.min(
        availableWidth / PREVIEW_DEVICE_WIDTH[device],
        Math.min(availableHeight, DEVICE_FRAME_LIMIT.PAGE_HEIGHT) /
          PREVIEW_DEVICE_HEIGHT[device],
        1,
      ),
    ),
  );

const deviceFrameChrome = (device: TPreviewDevice): TElementSize => {
  const { BORDER, BEZEL_PADDING, BROWSER_BAR_HEIGHT } = DEVICE_FRAME_SIZE;
  const borders = 2 * BORDER;

  return device === PREVIEW_DEVICE.DESKTOP
    ? { width: borders, height: borders + BROWSER_BAR_HEIGHT }
    : {
        width: borders + 2 * BEZEL_PADDING,
        height: borders + 2 * BEZEL_PADDING,
      };
};

export const fitStageScale = ({
  device,
  availableWidth,
  availableHeight = Number.POSITIVE_INFINITY,
}: {
  device: TPreviewDevice;
  availableWidth: number;
  availableHeight?: number;
}) => {
  const chrome = deviceFrameChrome(device);

  return roundScale(
    Math.max(
      0,
      Math.min(
        (availableWidth - chrome.width) / PREVIEW_DEVICE_WIDTH[device],
        (availableHeight - chrome.height) / PREVIEW_DEVICE_HEIGHT[device],
        1,
      ),
    ),
  );
};

export const fitFullscreenScale = ({
  device,
  availableWidth,
}: {
  device: TPreviewDevice;
  availableWidth: number;
}): Pick<TDeviceFrameLayout, 'scale' | 'isPanning'> => {
  const chrome = deviceFrameChrome(device);
  const scale = Math.min(
    (availableWidth - chrome.width) / PREVIEW_DEVICE_WIDTH[device],
    1,
  );

  return scale < DEVICE_FRAME_LIMIT.FULLSCREEN_MIN_SCALE
    ? { scale: 1, isPanning: true }
    : { scale: roundScale(scale), isPanning: false };
};

export const toScalePercent = (scale: number) =>
  Math.round(scale * DEVICE_FRAME_LIMIT.PERCENT);

export const resolveDeviceFrameLayout = ({
  device,
  fit: { mode, availableHeight },
  stageWidth,
}: {
  device: TPreviewDevice;
  fit: TDeviceFrameFit;
  stageWidth: TMaybeUndefined<number>;
}): TMaybeUndefined<TDeviceFrameLayout> => {
  if (isUndefined(stageWidth)) {
    return undefined;
  }

  if (mode === DEVICE_FRAME_FIT.FULLSCREEN) {
    const { scale, isPanning } = fitFullscreenScale({
      device,
      availableWidth: stageWidth,
    });

    return {
      scale,
      isPanning,
      viewport: {
        width: isPanning ? undefined : scaleDeviceSize(device, scale).width,
        height: undefined,
      },
    };
  }

  const fitScale =
    mode === DEVICE_FRAME_FIT.STAGE ? fitStageScale : fitPageScale;
  const scale = fitScale({
    device,
    availableWidth: stageWidth,
    availableHeight,
  });

  return { scale, isPanning: false, viewport: scaleDeviceSize(device, scale) };
};

export const toScrollThumb = ({
  offset,
  viewportSize,
  contentSize,
}: {
  offset: number;
  viewportSize: number;
  contentSize: number;
}): TMaybeNull<TScrollThumb> => {
  if (contentSize <= viewportSize || viewportSize <= 0) {
    return null;
  }

  const size = viewportSize / contentSize;
  const start = Math.min(Math.max(offset / contentSize, 0), 1 - size);

  return { start, size };
};
