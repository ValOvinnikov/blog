import { deviceFrameVariants } from '@platform/components/shared/device-frame/device-frame-variants';
import {
  DEVICE_FRAME_AXIS,
  DEVICE_FRAME_LIMIT,
  DEVICE_FRAME_TEST_ID,
  type TDeviceFrameAxis,
} from '@platform/constants/device-frame';
import type { TScrollThumb } from '@platform/utils/device-frame-scale/device-frame-scale';

const toPercent = (fraction: number) =>
  `${fraction * DEVICE_FRAME_LIMIT.PERCENT}%`;

export type TDeviceFrameScrollbarProps = {
  axis: TDeviceFrameAxis;
  thumb: TScrollThumb;
  isDark: boolean;
};

export const DeviceFrameScrollbar = ({
  axis,
  thumb: { start, size },
  isDark,
}: TDeviceFrameScrollbarProps) => {
  const { scrollbar, thumb } = deviceFrameVariants({ axis, isDark });
  const isVertical = axis === DEVICE_FRAME_AXIS.VERTICAL;

  return (
    <span
      aria-hidden="true"
      className={scrollbar()}
      data-testid={
        isVertical
          ? DEVICE_FRAME_TEST_ID.VERTICAL_SCROLLBAR
          : DEVICE_FRAME_TEST_ID.HORIZONTAL_SCROLLBAR
      }
    >
      <span
        className={thumb()}
        style={
          isVertical
            ? { top: toPercent(start), height: toPercent(size) }
            : { left: toPercent(start), width: toPercent(size) }
        }
      />
    </span>
  );
};
