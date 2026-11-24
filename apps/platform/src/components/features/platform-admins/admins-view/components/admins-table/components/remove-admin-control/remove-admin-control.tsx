'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  ADMINS_HEADING_ID,
  PLATFORM_ADMIN_REFUSAL,
  type TPlatformAdminRefusal,
} from '@platform/constants/platform-admins';
import { removeAdminAction } from '@platform/server/platform-admins/remove-admin-action';
import { useRowAction } from '@platform/utils/use-row-action/use-row-action';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TRemoveAdminControlProps = {
  adminId: string;
  displayName: string;
};

export const RemoveAdminControl = ({
  adminId,
  displayName,
}: TRemoveAdminControlProps) => {
  const t = useTranslations('removeAdminControl');
  const named = { name: displayName };
  const { onConfirm, onConfirmed } = useRowAction<TPlatformAdminRefusal>({
    done: t('done', named),
    gone: t('gone', named),
    failed: t('failed', named),
    refused: {
      [PLATFORM_ADMIN_REFUSAL.SELF]: t('self'),
      [PLATFORM_ADMIN_REFUSAL.LAST_SUPERADMIN]: t('lastSuperAdmin'),
    },
  });

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.DANGER}
      returnFocusId={ADMINS_HEADING_ID}
      onConfirm={() => onConfirm(removeAdminAction(adminId))}
      onConfirmed={onConfirmed}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        ariaLabel={t('triggerAriaLabel', named)}
      >
        {t('trigger')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('title', named)}
        description={t('description')}
        keepButtonLabel={t('keep')}
        confirmButtonLabel={t('confirm')}
        confirmingButtonLabel={t('confirming')}
      />
    </ConfirmDialog>
  );
};
