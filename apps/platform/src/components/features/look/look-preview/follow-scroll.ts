import type { TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import type { TDeviceFrameHandle } from '@platform/components/shared/device-frame';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import {
  LOOK_FOLLOW_LIMIT,
  LOOK_FOLLOW_OUTCOME,
  type TLookFollowOutcome,
} from '@platform/constants/look-follow';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  type TPreviewDevice,
} from '@platform/constants/preview';

type TScrollTarget = TValueOf<typeof DEVICE_FRAME_SCROLL_TARGET>;

export type TLookFollowSettled = {
  outcome: TLookFollowOutcome;
  overflow: number;
};

type TFollowScrollOptions = {
  frame: TDeviceFrameHandle;
  target: TScrollTarget;
  device: TPreviewDevice;
  behavior: ScrollBehavior;
  onSettled(settled: TLookFollowSettled): void;
};

const isNear = (a: number, b: TMaybeUndefined<number>) =>
  Math.abs(a - (b ?? Infinity)) <= LOOK_FOLLOW_LIMIT.SCROLL_TOLERANCE;

const settledAt = (outcome: TLookFollowOutcome, overflow = 0) => ({
  outcome,
  overflow,
});

const toMovedOutcome = (
  target: TScrollTarget,
  device: TPreviewDevice,
  contentHeight: number,
): TLookFollowSettled => {
  if (target === DEVICE_FRAME_SCROLL_TARGET.TOP) {
    return settledAt(LOOK_FOLLOW_OUTCOME.AT_TOP);
  }
  const screenHeight = PREVIEW_DEVICE_HEIGHT[device];
  const isNearlyFitting =
    device === PREVIEW_DEVICE.DESKTOP &&
    contentHeight < screenHeight * LOOK_FOLLOW_LIMIT.NEARLY_FITS_SCREENS;
  if (!isNearlyFitting) {
    return settledAt(LOOK_FOLLOW_OUTCOME.AT_END);
  }
  const { OVERFLOW_STEP } = LOOK_FOLLOW_LIMIT;
  return settledAt(
    LOOK_FOLLOW_OUTCOME.NEARLY_FITS,
    Math.round((contentHeight - screenHeight) / OVERFLOW_STEP) * OVERFLOW_STEP,
  );
};

export const followScroll = ({
  frame,
  target,
  device,
  behavior,
  onSettled,
}: TFollowScrollOptions) => {
  const startedAt = Date.now();
  let frameId = 0;
  let lastTop: TMaybeUndefined<number>;
  let stillFrames = 0;
  const destinationOf = (maxTop: number) =>
    target === DEVICE_FRAME_SCROLL_TARGET.TOP ? 0 : maxTop;

  const watch = () => {
    const metrics = frame.getScrollMetrics();
    if (!metrics) return;
    const { top, maxTop, contentHeight } = metrics;
    stillFrames = isNear(top, lastTop) ? stillFrames + 1 : 0;
    lastTop = top;
    const isSettled =
      isNear(top, destinationOf(maxTop)) ||
      stillFrames >= LOOK_FOLLOW_LIMIT.SETTLE_STILL_FRAMES ||
      Date.now() - startedAt >= LOOK_FOLLOW_LIMIT.SETTLE_TIMEOUT_MS;
    if (isSettled) {
      onSettled(toMovedOutcome(target, device, contentHeight));
      return;
    }
    frameId = requestAnimationFrame(watch);
  };

  const start = () => {
    const metrics = frame.getScrollMetrics();
    if (!metrics) return;
    const { top, maxTop } = metrics;
    if (maxTop <= LOOK_FOLLOW_LIMIT.SCROLL_TOLERANCE) {
      onSettled(settledAt(LOOK_FOLLOW_OUTCOME.FITS));
      return;
    }
    if (isNear(top, destinationOf(maxTop))) {
      onSettled(settledAt(LOOK_FOLLOW_OUTCOME.IN_VIEW));
      return;
    }
    frame.scrollTo(target, behavior);
    frameId = requestAnimationFrame(watch);
  };

  frameId = requestAnimationFrame(start);

  return () => cancelAnimationFrame(frameId);
};
