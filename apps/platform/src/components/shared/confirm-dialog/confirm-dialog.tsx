'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { ReactNode } from 'react';

import { confirmDialogVariants } from './confirm-dialog-variants';

export type TConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel: ReactNode;
  title: ReactNode;
  description: ReactNode;
  error?: string;
  confirmFieldId: string;
  confirmLabel: string;
  confirmHint: string;
  confirmValue: string;
  onConfirmValueChange: (value: string) => void;
  /** The typed confirmation text must match this exactly before the confirm button is enabled. */
  expectedValue: string;
  onConfirm: () => void;
  isPending: boolean;
  confirmButtonLabel: ReactNode;
  confirmingButtonLabel: ReactNode;
  cancelLabel: ReactNode;
  /** Extra content between the confirmation field and the action buttons, e.g. a dry-run toggle. */
  children?: ReactNode;
};

export const ConfirmDialog = ({
  isOpen,
  onOpenChange,
  triggerLabel,
  title,
  description,
  error,
  confirmFieldId,
  confirmLabel,
  confirmHint,
  confirmValue,
  onConfirmValueChange,
  expectedValue,
  onConfirm,
  isPending,
  confirmButtonLabel,
  confirmingButtonLabel,
  cancelLabel,
  children,
}: TConfirmDialogProps) => {
  const {
    backdrop,
    popup,
    title: titleSlot,
    description: descriptionSlot,
    hint,
    actions,
  } = confirmDialogVariants();

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Trigger render={<Button type="button" variant="danger" />}>
        {triggerLabel}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdrop()} />
        <AlertDialog.Popup className={popup()}>
          <AlertDialog.Title className={titleSlot()}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={descriptionSlot()}>
            {description}
          </AlertDialog.Description>

          {error && <Alert type={ALERT_TYPE.ERROR} title={error} />}

          <FormField
            label={confirmLabel}
            htmlFor={confirmFieldId}
            hint={<span className={hint()}>{confirmHint}</span>}
          >
            <TextInput
              id={confirmFieldId}
              value={confirmValue}
              onChange={onConfirmValueChange}
            />
          </FormField>

          {children}

          <div className={actions()}>
            <AlertDialog.Close
              render={<Button type="button" variant="ghost" />}
            >
              {cancelLabel}
            </AlertDialog.Close>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              isDisabled={isPending || confirmValue !== expectedValue}
            >
              {isPending ? confirmingButtonLabel : confirmButtonLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
