'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useId, useRef } from 'react';

export type TUsePopoverOptions = {
  trapFocus?: boolean;
  closeOnFocusOut?: boolean;
  overlayId?: string;
};

export const usePopover = ({
  trapFocus,
  closeOnFocusOut,
  overlayId,
}: TUsePopoverOptions = {}) => {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getTrigger = useCallback(() => triggerRef.current, []);
  const getPanel = useCallback(() => panelRef.current, []);

  const { open, toggle, close } = useDismissibleMenu({
    getTrigger,
    getPanel,
    trapFocus,
    closeOnFocusOut,
    overlayId,
  });

  return { open, toggle, close, panelId, triggerRef, panelRef };
};

export type TUsePopoverResult = ReturnType<typeof usePopover>;

export type TPopoverPanel = Pick<
  TUsePopoverResult,
  'panelId' | 'open' | 'panelRef'
>;
