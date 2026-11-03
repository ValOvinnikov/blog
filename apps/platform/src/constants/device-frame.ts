import type { TValueOf } from '@blog/config/utils';
import {
  PREVIEW_DEVICE,
  type TPreviewDevice,
} from '@platform/constants/preview';

export const DEVICE_FRAME_FIT = {
  PAGE: 'PAGE',
  STAGE: 'STAGE',
  FULLSCREEN: 'FULLSCREEN',
} as const;

export type TDeviceFrameFitMode = TValueOf<typeof DEVICE_FRAME_FIT>;

export const DEVICE_FRAME_LIMIT = {
  PAGE_HEIGHT: 608,
  FULLSCREEN_MIN_SCALE: 0.5,
  SCALE_PRECISION: 10000,
  PERCENT: 100,
} as const;

// The border, bezel padding and desktop bar in device-frame-variants.ts.
export const DEVICE_FRAME_CHROME = {
  [PREVIEW_DEVICE.DESKTOP]: { width: 2, height: 30 },
  [PREVIEW_DEVICE.TABLET]: { width: 14, height: 14 },
  [PREVIEW_DEVICE.PHONE]: { width: 14, height: 14 },
} as const satisfies Record<TPreviewDevice, { width: number; height: number }>;

export const DEVICE_FRAME_AXIS = {
  VERTICAL: 'VERTICAL',
  HORIZONTAL: 'HORIZONTAL',
} as const;

export type TDeviceFrameAxis = TValueOf<typeof DEVICE_FRAME_AXIS>;

export const DEVICE_FRAME_SCROLL_TARGET = {
  TOP: 'TOP',
  END: 'END',
} as const;

export const DEVICE_FRAME_TEST_ID = {
  FRAME: 'device-frame',
  VIEWPORT: 'device-frame-viewport',
  CONTENT: 'device-frame-content',
  BROWSER_BAR: 'device-frame-browser-bar',
  VERTICAL_SCROLLBAR: 'device-frame-vertical-scrollbar',
  HORIZONTAL_SCROLLBAR: 'device-frame-horizontal-scrollbar',
} as const;
