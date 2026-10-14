'use client';

import { useEffect, useState } from 'react';

const RELATIVE_TIME_TICK_MS = 60_000;

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
