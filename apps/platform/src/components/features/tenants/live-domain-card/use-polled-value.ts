'use client';

import { useEffect, useState } from 'react';

export type TPolledValueOptions<TValue> = {
  intervalMs: number;
  maxTicks: number;
  isFinal: (value: TValue) => boolean;
};

export const usePolledValue = <TValue>(
  tenantId: string,
  initialValue: TValue,
  fetchValue: (tenantId: string) => Promise<TValue>,
  { intervalMs, maxTicks, isFinal }: TPolledValueOptions<TValue>,
): TValue => {
  const [renderedInitialValue, setRenderedInitialValue] =
    useState(initialValue);
  const [value, setValue] = useState(initialValue);

  if (initialValue !== renderedInitialValue) {
    setRenderedInitialValue(initialValue);
    setValue(initialValue);
  }

  const isSettled = isFinal(value);

  useEffect(() => {
    if (isSettled) {
      return;
    }

    let cancelled = false;
    let ticks = 0;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      ticks += 1;
      if (ticks >= maxTicks) {
        clearInterval(intervalId);
      }

      fetchValue(tenantId)
        .then((result) => {
          if (!cancelled) {
            setValue(result);
          }
        })
        .catch(() => undefined);
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenantId, isSettled, fetchValue, intervalMs, maxTicks]);

  return value;
};
