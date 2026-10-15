'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ConfirmDialogContent } from '@platform/components/shared/confirm-dialog/components/content/confirm-dialog-content';
import { ConfirmDialogTrigger } from '@platform/components/shared/confirm-dialog/components/trigger/confirm-dialog-trigger';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@platform/lib/react';
import { Fragment, type ElementType } from 'react';

import {
  ConfirmDialogContext,
  type TConfirmDialogTone,
} from './confirm-dialog-context';
import {
  useConfirmDialog,
  type TUseConfirmDialogArgs,
} from './use-confirm-dialog';

const ConfirmDialogParts = {
  Trigger: ConfirmDialogTrigger,
  Content: ConfirmDialogContent,
} satisfies Record<string, ElementType>;

type TConfirmDialogProps = {
  expectedValue?: string;
  onConfirm: TUseConfirmDialogArgs['onConfirm'];
  onConfirmed?: TUseConfirmDialogArgs['onConfirmed'];
  onOpenChange?: TUseConfirmDialogArgs['onOpenChange'];
  tone?: TConfirmDialogTone;
  children: TCompoundChildren<typeof ConfirmDialogParts>;
};

const ConfirmDialogRoot = ({
  expectedValue,
  onConfirm,
  onConfirmed,
  onOpenChange,
  tone = 'danger',
  children,
}: TConfirmDialogProps) => {
  const dialog = useConfirmDialog({ onConfirm, onConfirmed, onOpenChange });
  const { slots, unmatched } = mapCompoundSlots(children, ConfirmDialogParts);

  return (
    <ConfirmDialogContext.Provider value={{ ...dialog, expectedValue, tone }}>
      <AlertDialog.Root open={dialog.isOpen} onOpenChange={dialog.changeOpen}>
        {slots.Trigger}
        {slots.Content}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </AlertDialog.Root>
    </ConfirmDialogContext.Provider>
  );
};

export const ConfirmDialog: TCompoundComponent<
  typeof ConfirmDialogRoot,
  typeof ConfirmDialogParts
> = Object.assign(ConfirmDialogRoot, ConfirmDialogParts);
