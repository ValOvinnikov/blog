'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

export type TUsePopoverOptions = {
  trapFocus?: boolean;
  closeOnFocusOut?: boolean;
};

/**
 * `close` is exposed alongside `toggle` for dismissing the panel from an
 * action inside it that isn't itself a focus-out (e.g. a link click).
 */
export const usePopover = ({
  trapFocus,
  closeOnFocusOut,
}: TUsePopoverOptions = {}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle, close } = useDismissibleMenu({
    getTrigger,
    getPanel,
    trapFocus,
    closeOnFocusOut,
  });

  return { open, toggle, close, triggerRef, panelRef };
};
