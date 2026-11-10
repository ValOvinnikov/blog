'use client';

import type { TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

export type TPolledValueOptions<TValue> = {
  intervalMs: number;
  maxTicks: number;
  isActive: (value: TValue) => boolean;
  onResult?: (value: TValue) => void;
  onError?: () => void;
};

type TPolledValue<TValue> = {
  value: TValue;
  setValue: Dispatch<SetStateAction<TValue>>;
  restart: () => void;
};

export const usePolledValue = <TValue>(
  key: string,
  initialValue: TValue,
  poll: (key: string) => Promise<TMaybeUndefined<TValue>>,
  {
    intervalMs,
    maxTicks,
    isActive,
    onResult,
    onError,
  }: TPolledValueOptions<TValue>,
): TPolledValue<TValue> => {
  const [renderedKey, setRenderedKey] = useState(key);
  const [renderedInitialValue, setRenderedInitialValue] =
    useState(initialValue);
  const [value, setValue] = useState(initialValue);
  const [restartCount, setRestartCount] = useState(0);
  const ticksRef = useRef(0);
  const isVisible = useDocumentVisible();

  if (key !== renderedKey || initialValue !== renderedInitialValue) {
    setRenderedKey(key);
    setRenderedInitialValue(initialValue);
    setValue(initialValue);
  }

  const shouldPoll = isActive(value) && isVisible;

  const fetchValue = useEffectEvent(() => poll(key));
  const handleResult = useEffectEvent((result: TValue) => {
    setValue(result);
    onResult?.(result);
  });
  const handleError = useEffectEvent(() => onError?.());

  useEffect(() => {
    ticksRef.current = 0;
  }, [key, initialValue, restartCount]);

  useEffect(() => {
    if (!shouldPoll || ticksRef.current >= maxTicks) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      ticksRef.current += 1;
      if (ticksRef.current >= maxTicks) {
        clearInterval(intervalId);
      }

      fetchValue()
        .then((result) => {
          if (!cancelled && !isUndefined(result)) {
            handleResult(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            handleError();
          }
        });
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [key, initialValue, restartCount, shouldPoll, intervalMs, maxTicks]);

  const restart = () => setRestartCount((count) => count + 1);

  return { value, setValue, restart };
};
