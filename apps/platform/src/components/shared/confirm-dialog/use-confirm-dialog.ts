'use client';

import { SHELL_MAIN_ID } from '@platform/constants/shell-frame';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TResult } from '@shinefold/utils';
import { useRef, useState, useTransition } from 'react';

export type TConfirmDialogActionResult = TResult<void, TMaybeUndefined<string>>;

export type TUseConfirmDialogArgs = {
  onConfirm: (confirmValue: string) => Promise<TConfirmDialogActionResult>;
  onConfirmed?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  returnFocusId?: string;
};

// Base UI moves focus into a non-tabbable target's first tabbable child, so the main region is focused here.
const focusAfterConfirm = (returnFocusId: string) => {
  const returnTarget = document.getElementById(returnFocusId);
  if (returnTarget) return returnTarget;

  const main = document.getElementById(SHELL_MAIN_ID);
  if (!main) return true;

  main.focus({ preventScroll: true });
  return false;
};

export const useConfirmDialog = ({
  onConfirm,
  onConfirmed,
  onOpenChange,
  returnFocusId,
}: TUseConfirmDialogArgs) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState<TMaybeUndefined<string>>(undefined);
  const [isPending, startTransition] = useTransition();
  const hasConfirmed = useRef(false);

  const changeOpen = (nextIsOpen: boolean) => {
    if (nextIsOpen) hasConfirmed.current = false;
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
      setConfirmValue('');
      setError(undefined);
    }
    onOpenChange?.(nextIsOpen);
  };

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await onConfirm(confirmValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      hasConfirmed.current = true;
      changeOpen(false);
      onConfirmed?.();
    });
  };

  const finalFocus = returnFocusId
    ? () => (hasConfirmed.current ? focusAfterConfirm(returnFocusId) : true)
    : undefined;

  return {
    isOpen,
    changeOpen,
    confirmValue,
    setConfirmValue,
    error,
    isPending,
    confirm,
    finalFocus,
  };
};
