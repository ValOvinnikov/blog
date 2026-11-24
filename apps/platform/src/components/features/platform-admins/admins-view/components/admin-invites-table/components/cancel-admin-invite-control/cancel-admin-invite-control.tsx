'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import {
  ADMIN_INVITES_HEADING_ID,
  type TPlatformAdminRefusal,
} from '@platform/constants/platform-admins';
import { cancelAdminInviteAction } from '@platform/server/platform-admins/cancel-admin-invite-action';
import { useRowAction } from '@platform/utils/use-row-action/use-row-action';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TCancelAdminInviteControlProps = {
  inviteId: string;
  email: string;
};

export const CancelAdminInviteControl = ({
  inviteId,
  email,
}: TCancelAdminInviteControlProps) => {
  const t = useTranslations('cancelAdminInviteControl');
  const { onConfirm, onConfirmed } = useRowAction<TPlatformAdminRefusal>({
    done: t('done', { email }),
    gone: t('gone'),
    failed: t('failed'),
  });

  return (
    <ConfirmDialog
      returnFocusId={ADMIN_INVITES_HEADING_ID}
      onConfirm={() => onConfirm(cancelAdminInviteAction(inviteId))}
      onConfirmed={onConfirmed}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        ariaLabel={t('triggerAriaLabel', { email })}
      >
        {t('trigger')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('title', { email })}
        description={t('description')}
        keepButtonLabel={t('keep')}
        confirmButtonLabel={t('confirm')}
        confirmingButtonLabel={t('confirming')}
      />
    </ConfirmDialog>
  );
};
