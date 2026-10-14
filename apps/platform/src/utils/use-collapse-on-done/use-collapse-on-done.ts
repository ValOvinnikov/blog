'use client';

import { useState } from 'react';

export type TUseCollapseOnDoneResult = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** Collapses only the first time `isDone` turns true, so a polling page cannot keep forcing a user-reopened panel shut. */
export const useCollapseOnDone = (
  isDone: boolean,
): TUseCollapseOnDoneResult => {
  const [isOpen, setIsOpen] = useState(() => !isDone);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(isDone);

  if (isDone && !hasAutoCollapsed) {
    setHasAutoCollapsed(true);
    setIsOpen(false);
  }

  return { isOpen, onOpenChange: setIsOpen };
};
