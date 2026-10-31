import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { AlertDialogShell } from '@platform/components/shared/alert-dialog-shell';
import { Button } from '@platform/components/shared/button';
import { useConfirmDialogContext } from '@platform/components/shared/confirm-dialog/confirm-dialog-context';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TConfirmDialogContentProps = {
  title: ReactNode;
  description: ReactNode;
  confirmButtonLabel: ReactNode;
  confirmingButtonLabel: string;
  isConfirmDisabled?: boolean;
  children?: ReactNode;
};

export const ConfirmDialogContent = ({
  title,
  description,
  confirmButtonLabel,
  confirmingButtonLabel,
  isConfirmDisabled = false,
  children,
}: TConfirmDialogContentProps) => {
  const t = useTranslations('confirmDialog');
  const {
    expectedValue,
    tone,
    confirmValue,
    setConfirmValue,
    error,
    isPending,
    confirm,
  } = useConfirmDialogContext();

  return (
    <AlertDialogShell
      title={title}
      description={description}
      actions={
        <>
          <AlertDialog.Close
            render={<Button type="button" variant={BUTTON_VARIANT.GHOST} />}
          >
            {t('cancelButton')}
          </AlertDialog.Close>
          <Button
            type="button"
            variant={tone}
            onClick={confirm}
            isDisabled={
              isConfirmDisabled ||
              (expectedValue !== undefined && confirmValue !== expectedValue)
            }
            isPending={isPending}
            pendingLabel={confirmingButtonLabel}
          >
            {confirmButtonLabel}
          </Button>
        </>
      }
    >
      {error && <Alert type={ALERT_TYPE.ERROR} title={error} />}

      {expectedValue !== undefined && (
        <FormField
          label={t('confirmLabel', { name: expectedValue })}
          hint={t('confirmHint')}
        >
          <TextInput value={confirmValue} onChange={setConfirmValue} />
        </FormField>
      )}

      {children}
    </AlertDialogShell>
  );
};
