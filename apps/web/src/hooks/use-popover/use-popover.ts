'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

export type TUsePopoverOptions = {
  /** Forwarded to `useDismissibleMenu` as-is. Defaults to `true`. */
  trapFocus?: boolean;
  /** Forwarded to `useDismissibleMenu` as-is. Defaults to `false`. */
  closeOnFocusOut?: boolean;
};

/**
 * usePopover — thin adapter over `useDismissibleMenu` for consumers that can
 * forward refs directly onto their trigger/panel elements (`triggerRef` onto
 * `PopoverMenu.Trigger`, `panelRef` onto `PopoverMenu.Panel`). `close` is
 * exposed alongside `toggle` for dismissing the panel from an action inside
 * it that isn't itself a focus-out (e.g. a link click).
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
