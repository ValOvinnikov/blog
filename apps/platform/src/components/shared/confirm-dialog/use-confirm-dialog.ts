'use client';

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

  const requestOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isPending) return;
    changeOpen(nextIsOpen);
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
    ? () =>
        (hasConfirmed.current
          ? document.getElementById(returnFocusId)
          : null) ?? true
    : undefined;

  return {
    isOpen,
    requestOpenChange,
    confirmValue,
    setConfirmValue,
    error,
    isPending,
    confirm,
    finalFocus,
  };
};
