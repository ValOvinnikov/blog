'use client';

import { useEffect, useRef, useState } from 'react';

export type TUseCollapseOnDoneResult = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Drives a `Disclosure`'s open state so it starts collapsed once `isDone` is
 * already true, auto-collapses the first time `isDone` turns true, and never
 * overrides a later manual toggle — a polling page that flips `isDone` on
 * every re-render must not keep forcing a user-reopened panel shut.
 */
export const useCollapseOnDone = (
  isDone: boolean,
): TUseCollapseOnDoneResult => {
  const [isOpen, setIsOpen] = useState(() => !isDone);
  const hasAutoCollapsedRef = useRef(false);

  useEffect(() => {
    if (isDone && !hasAutoCollapsedRef.current) {
      hasAutoCollapsedRef.current = true;
      setIsOpen(false);
    }
  }, [isDone]);

  return { isOpen, onOpenChange: setIsOpen };
};
