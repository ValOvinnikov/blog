import type { TValueOf } from '@blog/config/utils';

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

export const DEVICE_FRAME_SIZE = {
  BORDER: 1,
  BEZEL_PADDING: 6,
  BROWSER_BAR_HEIGHT: 28,
} as const;

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
