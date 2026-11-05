import type { TMaybeUndefined } from '@blog/config';
import type { TDeviceFrameHandle } from '@platform/components/shared/device-frame';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import { LOOK_FOLLOW_TARGET } from '@platform/constants/look-follow';
import type { TPreviewDevice } from '@platform/constants/preview';
import {
  LOOK_FOLLOW_SCROLL,
  toLookFollowKey,
  type TLookFollowTarget,
} from '@platform/utils/look-follow-target/look-follow-target';
import { useMotionScrollBehavior } from '@platform/utils/use-motion-scroll-behavior/use-motion-scroll-behavior';
import { useEffect, useRef, useState } from 'react';

import { followScroll, type TLookFollowSettled } from './follow-scroll';

type TUseLookFollowOptions = {
  target: TLookFollowTarget;
  device: TPreviewDevice;
  scale: number;
  isShown: boolean;
};

type TKeyedSettled = TLookFollowSettled & { key: string };

export const useLookFollow = ({
  target,
  device,
  scale,
  isShown,
}: TUseLookFollowOptions) => {
  const frameRef = useRef<TDeviceFrameHandle>(null);
  const layoutRef = useRef<TMaybeUndefined<string>>(undefined);
  const scrollBehavior = useMotionScrollBehavior();
  const [isOn, setIsOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [request, setRequest] = useState(0);
  const [settled, setSettled] = useState<TMaybeUndefined<TKeyedSettled>>();
  const targetKey = toLookFollowKey(target);
  const [seenTargetKey, setSeenTargetKey] = useState(targetKey);
  if (seenTargetKey !== targetKey) {
    setSeenTargetKey(targetKey);
    setIsPaused(false);
  }

  const row = target.kind === LOOK_FOLLOW_TARGET.PART ? target.row : undefined;
  const scrollTarget = row
    ? LOOK_FOLLOW_SCROLL[row]
    : target.kind === LOOK_FOLLOW_TARGET.IDLE
      ? DEVICE_FRAME_SCROLL_TARGET.TOP
      : undefined;
  const isActive = isOn && !isPaused;
  const isFollowing = isActive && !!row;
  const layoutKey = `${device}|${isShown}|${scale}`;
  const settledKey = `${targetKey}|${device}|${request}`;

  useEffect(() => {
    const isJump = layoutRef.current !== layoutKey;
    layoutRef.current = layoutKey;
    const frame = frameRef.current;
    if (!isActive || !isShown || !scrollTarget || !frame) return;
    return followScroll({
      frame,
      target: scrollTarget,
      device,
      behavior: isJump ? 'instant' : scrollBehavior,
      onSettled: (next) =>
        setSettled((previous) =>
          previous?.key === settledKey
            ? previous
            : { ...next, key: settledKey },
        ),
    });
  }, [
    isActive,
    isShown,
    scrollTarget,
    device,
    layoutKey,
    settledKey,
    scrollBehavior,
  ]);

  const refollow = () => {
    setIsPaused(false);
    setRequest((count) => count + 1);
  };

  const currentSettled: TMaybeUndefined<TLookFollowSettled> =
    settled?.key === settledKey
      ? { outcome: settled.outcome, overflow: settled.overflow }
      : undefined;

  const follow = {
    row,
    isOn,
    isPaused,
    isFollowing,
    settled: currentSettled,
    onPressedChange: (isPressed: boolean) => {
      setIsOn(isPressed);
      if (isPressed) refollow();
      else setIsPaused(false);
    },
    onHandScroll: () => {
      if (isFollowing) setIsPaused(true);
    },
    resume: refollow,
    scrollToTop: () => {
      frameRef.current?.scrollTo(
        DEVICE_FRAME_SCROLL_TARGET.TOP,
        scrollBehavior,
      );
      setIsPaused(true);
    },
  };

  return { frameRef, follow };
};

export type TLookFollow = ReturnType<typeof useLookFollow>['follow'];
