import { AlertDialog } from '@base-ui/react/alert-dialog';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import type { ReactNode } from 'react';

import { alertDialogShellVariants } from './alert-dialog-shell-variants';

type TAlertDialogShellProps = {
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
};

export const AlertDialogShell = ({
  title,
  description,
  actions,
  children,
}: TAlertDialogShellProps) => {
  const {
    backdrop,
    popup,
    description: descriptionSlot,
    actions: actionsSlot,
  } = alertDialogShellVariants();

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
        {children}
        <div className={actionsSlot()}>{actions}</div>
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  );
};
