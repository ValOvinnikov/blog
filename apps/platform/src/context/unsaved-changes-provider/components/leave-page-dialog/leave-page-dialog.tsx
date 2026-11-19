'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { AlertDialogShell } from '@platform/components/shared/alert-dialog-shell';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';

type TLeavePageDialogProps = {
  isOpen: boolean;
  description: string;
  isSaving: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export const LeavePageDialog = ({
  isOpen,
  description,
  isSaving,
  onStay,
  onDiscard,
  onSave,
}: TLeavePageDialogProps) => {
  const t = useTranslations('leavePageDialog');

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onStay();
      }}
    >
      <AlertDialogShell
        title={t('title')}
        description={description}
        actions={
          <>
            <Button
              variant={BUTTON_VARIANT.GHOST}
              onClick={onStay}
              isDisabled={isSaving}
            >
              {t('stay')}
            </Button>
            <Button
              variant={BUTTON_VARIANT.DANGER}
              onClick={onDiscard}
              isDisabled={isSaving}
            >
              {t('discardAndLeave')}
            </Button>
            <Button
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={onSave}
              isPending={isSaving}
              pendingLabel={t('saving')}
            >
              {t('saveAndLeave')}
            </Button>
          </>
        }
      />
    </AlertDialog.Root>
  );
};
