import { deviceFrameVariants } from '@platform/components/shared/device-frame/device-frame-variants';
import {
  DEVICE_FRAME_SIZE,
  DEVICE_FRAME_TEST_ID,
} from '@platform/constants/device-frame';
import type { TMaybeUndefined } from '@shinefold/config';

export type TDeviceFrameBrowserBarProps = {
  host: TMaybeUndefined<string>;
};

export const DeviceFrameBrowserBar = ({
  host,
}: TDeviceFrameBrowserBarProps) => {
  const {
    browserBar,
    dots,
    dot,
    host: hostSlot,
    hostSpacer,
  } = deviceFrameVariants();

  return (
    <div
      className={browserBar()}
      style={{ height: DEVICE_FRAME_SIZE.BROWSER_BAR_HEIGHT }}
      data-testid={DEVICE_FRAME_TEST_ID.BROWSER_BAR}
    >
      <span aria-hidden="true" className={dots()}>
        <span className={dot()} />
        <span className={dot()} />
        <span className={dot()} />
      </span>
      {host && (
        <>
          <span className={hostSlot()}>{host}</span>
          <span aria-hidden="true" className={hostSpacer()} />
        </>
      )}
    </div>
  );
};
