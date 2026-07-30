'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

/**
 * usePopover — thin adapter over `useDismissibleMenu` (the shared Escape/
 * outside-click/focus-trap/roving-focus core, also consumed by
 * `useMobileNavToggle`) for consumers that can forward refs directly onto
 * their trigger/panel elements.
 *
 * The caller wires `triggerRef` onto `PopoverMenu.Trigger`'s `ref` and
 * `panelRef` onto `PopoverMenu.Panel`'s `ref`.
 */
export const usePopover = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle } = useDismissibleMenu({ getTrigger, getPanel });

  return { open, toggle, triggerRef, panelRef };
};
