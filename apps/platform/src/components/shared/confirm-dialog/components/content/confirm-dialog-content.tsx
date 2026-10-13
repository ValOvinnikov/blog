import { AlertDialog } from '@base-ui/react/alert-dialog';
import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { useConfirmDialogContext } from '@platform/components/shared/confirm-dialog/confirm-dialog-context';
import { confirmDialogVariants } from '@platform/components/shared/confirm-dialog/confirm-dialog-variants';
import { FormField } from '@platform/components/shared/form-field';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { TextInput } from '@platform/components/shared/text-input';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TConfirmDialogContentProps = {
  title: ReactNode;
  description: ReactNode;
  confirmButtonLabel: ReactNode;
  confirmingButtonLabel: string;
  children?: ReactNode;
};

export const ConfirmDialogContent = ({
  title,
  description,
  confirmButtonLabel,
  confirmingButtonLabel,
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
  const {
    backdrop,
    popup,
    description: descriptionSlot,
    actions,
  } = confirmDialogVariants();

  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className={backdrop()} />
      <AlertDialog.Popup className={popup()}>
        <AlertDialog.Title className={headingVariants({ size: 'cardTitle' })}>
          {title}
        </AlertDialog.Title>
        <AlertDialog.Description className={descriptionSlot()}>
          {description}
        </AlertDialog.Description>

        {error && <Alert type={ALERT_TYPE.ERROR} title={error} />}

        <FormField
          label={t('confirmLabel', { name: expectedValue })}
          hint={t('confirmHint')}
        >
          <TextInput value={confirmValue} onChange={setConfirmValue} />
        </FormField>

        {children}

        <div className={actions()}>
          <AlertDialog.Close render={<Button type="button" variant="ghost" />}>
            {t('cancelButton')}
          </AlertDialog.Close>
          <Button
            type="button"
            variant={tone}
            onClick={confirm}
            isDisabled={confirmValue !== expectedValue}
            isPending={isPending}
            pendingLabel={confirmingButtonLabel}
          >
            {confirmButtonLabel}
          </Button>
        </div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  );
};
