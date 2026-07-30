'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

export type TUsePopoverOptions = {
  /**
   * Forwarded to `useDismissibleMenu` as-is. Defaults to `true` (trapped
   * Tab + Arrow/Home/End roving focus), matching every existing caller
   * (`PostShare`'s command-style share menu). Pass `false` for a non-modal,
   * in-page navigation disclosure — e.g. `PostContentsRail`'s mobile panel
   * — where ordinary Tab order should carry through.
   */
  trapFocus?: boolean;
  /**
   * Forwarded to `useDismissibleMenu` as-is. Defaults to `false`, matching
   * every existing caller (`PostShare`). Pass `true` for a non-modal overlay
   * panel that must not stay open once focus moves past it — e.g.
   * `PostContentsRail`'s `position: sticky` mobile disclosure.
   */
  closeOnFocusOut?: boolean;
};

/**
 * usePopover — thin adapter over `useDismissibleMenu` (the shared Escape/
 * outside-click/focus-trap/roving-focus core, also consumed by
 * `useMobileNavToggle`) for consumers that can forward refs directly onto
 * their trigger/panel elements.
 *
 * The caller wires `triggerRef` onto `PopoverMenu.Trigger`'s `ref` and
 * `panelRef` onto `PopoverMenu.Panel`'s `ref`.
 */
export const usePopover = ({
  trapFocus,
  closeOnFocusOut,
}: TUsePopoverOptions = {}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle } = useDismissibleMenu({
    getTrigger,
    getPanel,
    trapFocus,
    closeOnFocusOut,
  });

  return { open, toggle, triggerRef, panelRef };
};
