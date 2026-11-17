import type { TPreviewDevice } from '@platform/constants/preview';
import type { TDeviceFrameFit } from '@platform/utils/device-frame-scale/device-frame-scale';
import type { ReactNode, Ref } from 'react';

import type { TUseDeviceFrameOptions } from './use-device-frame';
import type { TDeviceFrameHandle } from './use-device-frame-handle';

type TDeviceFrameChrome = {
  host?: string;
  isDark: boolean;
};

type TDeviceFrameListeners = Pick<
  TUseDeviceFrameOptions,
  'onScaleChange' | 'onHandScroll'
>;

export type TDeviceFrameProps = {
  device: TPreviewDevice;
  chrome: TDeviceFrameChrome;
  fit?: TDeviceFrameFit;
  listeners?: TDeviceFrameListeners;
  isInteractive?: boolean;
  children: ReactNode;
  ref?: Ref<TDeviceFrameHandle>;
};
