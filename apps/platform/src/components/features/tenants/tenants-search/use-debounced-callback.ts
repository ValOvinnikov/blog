import type { TMaybeUndefined } from '@blog/config/types';
import { useEffect, useRef } from 'react';

export const useDebouncedCallback = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) => {
  const latestCallback = useRef(callback);
  const timer =
    useRef<TMaybeUndefined<ReturnType<typeof setTimeout>>>(undefined);

  useEffect(() => {
    latestCallback.current = callback;
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const cancel = () => clearTimeout(timer.current);

  const schedule = (...args: TArgs) => {
    cancel();
    timer.current = setTimeout(() => latestCallback.current(...args), delayMs);
  };

  return { schedule, cancel };
};
