import type { TMaybeUndefined } from '@blog/config';
import type { TDeviceFrameHandle } from '@platform/components/shared/device-frame';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import {
  LOOK_FOLLOW_LIMIT,
  LOOK_FOLLOW_TARGET,
} from '@platform/constants/look-follow';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import type { TPreviewDevice } from '@platform/constants/preview';
import {
  LOOK_FOLLOW_SCROLL,
  toLookFollowKey,
  type TLookFollowTarget,
} from '@platform/utils/look-follow-target/look-follow-target';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
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
  const isReducedMotion = useMediaQuery(MEDIA_QUERY.REDUCED_MOTION);
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
  const isFollowing = isOn && !isPaused && !!row;
  const layoutKey = `${device}|${isShown}|${scale}`;
  const followKey = `${targetKey}|${layoutKey}|${request}`;
  const scrollBehavior: ScrollBehavior = isReducedMotion ? 'instant' : 'smooth';

  useEffect(() => {
    const isJump = layoutRef.current !== layoutKey;
    layoutRef.current = layoutKey;
    const frame = frameRef.current;
    if (!isFollowing || !isShown || !row || !frame) return;
    return followScroll({
      frame,
      target: LOOK_FOLLOW_SCROLL[row],
      device,
      behavior: isJump ? 'instant' : scrollBehavior,
      onSettled: (next) => setSettled({ ...next, key: followKey }),
    });
  }, [isFollowing, isShown, row, device, layoutKey, followKey, scrollBehavior]);

  const refollow = () => {
    setIsPaused(false);
    setRequest((count) => count + 1);
  };

  const currentSettled: TMaybeUndefined<TLookFollowSettled> =
    settled?.key === followKey ? settled : undefined;

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
      const metrics = frameRef.current?.getScrollMetrics();
      if (!isFollowing || !metrics) return;
      if (metrics.maxTop > LOOK_FOLLOW_LIMIT.SCROLL_TOLERANCE) {
        setIsPaused(true);
      }
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
