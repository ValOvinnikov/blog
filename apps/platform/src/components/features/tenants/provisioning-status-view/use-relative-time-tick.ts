'use client';

import { useEffect, useState } from 'react';

const RELATIVE_TIME_TICK_MS = 60_000;

/**
 * Forces a periodic re-render so already-rendered relative-time labels keep
 * advancing even once `useProvisioningPoll` has stopped polling on a
 * terminal run — its interval is independent of, and never interferes
 * with, that one.
 */
export const useRelativeTimeTick = (): void => {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      forceRerender((tick) => tick + 1);
    }, RELATIVE_TIME_TICK_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
};
