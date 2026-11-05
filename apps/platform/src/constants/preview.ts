import type { TValueOf } from '@blog/config/utils';

export const PREVIEW_MODE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
} as const;

export type TPreviewMode = TValueOf<typeof PREVIEW_MODE>;

export const PREVIEW_WIDTH = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
} as const;

export type TPreviewWidth = TValueOf<typeof PREVIEW_WIDTH>;

export const PREVIEW_READER_STATE = {
  SIGNED_OUT: 'SIGNED_OUT',
  SIGNED_IN: 'SIGNED_IN',
} as const;

export type TPreviewReaderState = TValueOf<typeof PREVIEW_READER_STATE>;

export const PREVIEW_DEVICE = {
  DESKTOP: 'DESKTOP',
  TABLET: 'TABLET',
  PHONE: 'PHONE',
} as const;

export type TPreviewDevice = TValueOf<typeof PREVIEW_DEVICE>;

export const PREVIEW_DEVICE_WIDTH = {
  [PREVIEW_DEVICE.DESKTOP]: 1280,
  [PREVIEW_DEVICE.TABLET]: 820,
  [PREVIEW_DEVICE.PHONE]: 390,
} as const satisfies Record<TPreviewDevice, number>;

export const PREVIEW_DEVICE_HEIGHT = {
  [PREVIEW_DEVICE.DESKTOP]: 800,
  [PREVIEW_DEVICE.TABLET]: 1180,
  [PREVIEW_DEVICE.PHONE]: 844,
} as const satisfies Record<TPreviewDevice, number>;

export const PREVIEW_HEADING_LAYOUT = {
  SECTION: 'SECTION',
  PHONE_TAB: 'PHONE_TAB',
} as const;

export type TPreviewHeadingLayout = TValueOf<typeof PREVIEW_HEADING_LAYOUT>;

export const PREVIEW_READOUT = {
  LONG_MIN_WIDTH: 476,
} as const;

export const PREVIEW_FRAME_STATUS_TEST_ID = 'preview-frame-status-text';
