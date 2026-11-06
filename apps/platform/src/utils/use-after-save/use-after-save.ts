import type { TMaybeUndefined } from '@blog/config';
import { useEffect, useRef, useState } from 'react';

// Content is inert while a save runs, so the callback waits for it to settle.
export const useAfterSave = (isPending: boolean) => {
  const callbackRef = useRef<TMaybeUndefined<() => void>>(undefined);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const callback = callbackRef.current;
    if (!callback || isPending) return;
    callbackRef.current = undefined;
    callback();
  }, [isPending, requestCount]);

  return (callback: () => void) => {
    callbackRef.current = callback;
    setRequestCount((count) => count + 1);
  };
};
