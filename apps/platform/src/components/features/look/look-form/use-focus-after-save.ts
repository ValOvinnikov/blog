import type { TMaybeUndefined } from '@blog/config';
import { useEffect, useRef } from 'react';

// The edit panel is inert while a save runs, so focus waits for it to settle.
export const useFocusAfterSave = (isPending: boolean) => {
  const targetIdRef = useRef<TMaybeUndefined<string>>(undefined);

  useEffect(() => {
    const targetId = targetIdRef.current;
    if (targetId === undefined || isPending) return;
    targetIdRef.current = undefined;
    document.getElementById(targetId)?.focus();
  }, [isPending]);

  return (targetId: string) => {
    targetIdRef.current = targetId;
  };
};
