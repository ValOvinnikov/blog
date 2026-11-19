import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { alertDialogShellVariants } from '@platform/components/shared/alert-dialog-shell/alert-dialog-shell-variants';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { DIALOG_BACKDROP_TONE } from '@platform/constants/dialog-backdrop';
import { dialogBackdropVariants } from '@platform/utils/dialog-backdrop-variants/dialog-backdrop-variants';
import type { ReactNode } from 'react';

type TDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isPending?: boolean;
  title: ReactNode;
  description?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export const Dialog = ({
  isOpen,
  onOpenChange,
  isPending = false,
  title,
  description,
  footer,
  children,
}: TDialogProps) => {
  const {
    popup,
    description: descriptionSlot,
    actions,
  } = alertDialogShellVariants();

  const changeOpen = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isPending) return;
    onOpenChange(nextIsOpen);
  };

  return (
    <BaseDialog.Root open={isOpen} onOpenChange={changeOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={dialogBackdropVariants({
            tone: DIALOG_BACKDROP_TONE.DIM,
          })}
        />
        <BaseDialog.Popup className={popup()}>
          <BaseDialog.Title className={headingVariants({ size: 'cardTitle' })}>
            {title}
          </BaseDialog.Title>
          {description && (
            <BaseDialog.Description className={descriptionSlot()}>
              {description}
            </BaseDialog.Description>
          )}
          {children}
          <div className={actions()}>{footer}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
};
