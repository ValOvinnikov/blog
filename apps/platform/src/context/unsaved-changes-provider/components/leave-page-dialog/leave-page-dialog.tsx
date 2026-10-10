'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@platform/components/shared/button';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { useTranslations } from 'next-intl';

import { leavePageDialogVariants } from './leave-page-dialog-variants';

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
  const {
    backdrop,
    popup,
    description: descriptionSlot,
    actions,
  } = leavePageDialogVariants();

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onStay();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={backdrop()} />
        <AlertDialog.Popup className={popup()}>
          <AlertDialog.Title className={headingVariants({ size: 'cardTitle' })}>
            {t('title')}
          </AlertDialog.Title>
          <AlertDialog.Description className={descriptionSlot()}>
            {description}
          </AlertDialog.Description>
          <div className={actions()}>
            <Button variant="ghost" onClick={onStay} isDisabled={isSaving}>
              {t('stay')}
            </Button>
            <Button variant="danger" onClick={onDiscard} isDisabled={isSaving}>
              {t('discardAndLeave')}
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              isPending={isSaving}
              pendingLabel={t('saving')}
            >
              {t('saveAndLeave')}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
