'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { TEAM_INVITES_HEADING_ID } from '@platform/constants/team-access';
import { cancelTeamInviteAction } from '@platform/server/team/cancel-team-invite-action';
import { useTeamRowAction } from '@platform/utils/use-team-row-action/use-team-row-action';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TCancelInviteControlProps = {
  tenantId: string;
  inviteId: string;
  email: string;
};

export const CancelInviteControl = ({
  tenantId,
  inviteId,
  email,
}: TCancelInviteControlProps) => {
  const t = useTranslations('teamPage.cancelInvite');
  const { onConfirm, onConfirmed } = useTeamRowAction({
    done: t('done', { email }),
    gone: t('gone'),
    failed: t('failed'),
  });

  return (
    <ConfirmDialog
      returnFocusId={TEAM_INVITES_HEADING_ID}
      onConfirm={() => onConfirm(cancelTeamInviteAction(tenantId, inviteId))}
      onConfirmed={onConfirmed}
    >
      <ConfirmDialog.Trigger
        variant={BUTTON_VARIANT.GHOST}
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
