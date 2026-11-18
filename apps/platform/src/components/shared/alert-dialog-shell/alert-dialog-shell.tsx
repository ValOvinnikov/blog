import { AlertDialog } from '@base-ui/react/alert-dialog';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { DIALOG_BACKDROP_TONE } from '@platform/constants/dialog-backdrop';
import { dialogBackdropVariants } from '@platform/utils/dialog-backdrop-variants/dialog-backdrop-variants';
import type { ComponentProps, ReactNode } from 'react';

import { alertDialogShellVariants } from './alert-dialog-shell-variants';

type TAlertDialogShellProps = {
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  finalFocus?: ComponentProps<typeof AlertDialog.Popup>['finalFocus'];
  children?: ReactNode;
};

export const AlertDialogShell = ({
  title,
  description,
  actions,
  finalFocus,
  children,
}: TAlertDialogShellProps) => {
  const {
    popup,
    description: descriptionSlot,
    actions: actionsSlot,
  } = alertDialogShellVariants();

  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop
        className={dialogBackdropVariants({ tone: DIALOG_BACKDROP_TONE.DIM })}
      />
      <AlertDialog.Popup className={popup()} finalFocus={finalFocus}>
        <AlertDialog.Title className={headingVariants({ size: 'cardTitle' })}>
          {title}
        </AlertDialog.Title>
        <AlertDialog.Description className={descriptionSlot()}>
          {description}
        </AlertDialog.Description>
        {children}
        <div className={actionsSlot()}>{actions}</div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  );
};
