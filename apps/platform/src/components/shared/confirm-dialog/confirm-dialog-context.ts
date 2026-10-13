'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TButtonVariants } from '@platform/components/shared/button/button-variants';
import { createContext, useContext } from 'react';

import type { useConfirmDialog } from './use-confirm-dialog';

export type TConfirmDialogTone = Extract<
  TButtonVariants['variant'],
  'danger' | 'primary'
>;

type TConfirmDialogContext = ReturnType<typeof useConfirmDialog> & {
  expectedValue: string;
  tone: TConfirmDialogTone;
};

export const ConfirmDialogContext =
  createContext<TMaybeUndefined<TConfirmDialogContext>>(undefined);

export const useConfirmDialogContext = (): TConfirmDialogContext => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      'useConfirmDialogContext must be used within a ConfirmDialog',
    );
  }
  return context;
};
