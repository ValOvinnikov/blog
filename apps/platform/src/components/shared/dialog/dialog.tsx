import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AlertDialogShell } from '@platform/components/shared/alert-dialog-shell';
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
  const changeOpen = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isPending) return;
    onOpenChange(nextIsOpen);
  };

  return (
    <BaseDialog.Root open={isOpen} onOpenChange={changeOpen}>
      <AlertDialogShell
        title={title}
        description={description}
        actions={footer}
      >
        {children}
      </AlertDialogShell>
    </BaseDialog.Root>
  );
};
