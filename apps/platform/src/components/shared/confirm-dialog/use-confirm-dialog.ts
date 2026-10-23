'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TResult } from '@blog/utils';
import { useState, useTransition } from 'react';

export type TConfirmDialogActionResult = TResult<void, TMaybeUndefined<string>>;

export type TUseConfirmDialogArgs = {
  onConfirm: (confirmValue: string) => Promise<TConfirmDialogActionResult>;
  onConfirmed?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
};

export const useConfirmDialog = ({
  onConfirm,
  onConfirmed,
  onOpenChange,
}: TUseConfirmDialogArgs) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState<TMaybeUndefined<string>>(undefined);
  const [isPending, startTransition] = useTransition();

  const changeOpen = (nextIsOpen: boolean) => {
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
      changeOpen(false);
      onConfirmed?.();
    });
  };

  return {
    isOpen,
    changeOpen,
    confirmValue,
    setConfirmValue,
    error,
    isPending,
    confirm,
  };
};
