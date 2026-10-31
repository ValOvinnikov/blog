'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { BUTTON_VARIANT } from '@platform/constants/button';
import { createContext, useContext } from 'react';

import type { useConfirmDialog } from './use-confirm-dialog';

export type TConfirmDialogTone =
  typeof BUTTON_VARIANT.DANGER | typeof BUTTON_VARIANT.PRIMARY;

type TConfirmDialogContext = ReturnType<typeof useConfirmDialog> & {
  expectedValue: TMaybeUndefined<string>;
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
