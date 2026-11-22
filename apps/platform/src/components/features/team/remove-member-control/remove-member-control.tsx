'use client';

import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  TEAM_MEMBERS_HEADING_ID,
  TEAM_REFUSAL,
} from '@platform/constants/team-access';
import { removeTeamMemberAction } from '@platform/server/team/remove-team-member-action';
import { useTeamRowAction } from '@platform/utils/use-team-row-action/use-team-row-action';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export type TRemoveMemberControlProps = {
  tenantId: string;
  membershipId: string;
  email: TMaybeUndefined<string>;
};

export const RemoveMemberControl = ({
  tenantId,
  membershipId,
  email,
}: TRemoveMemberControlProps) => {
  const t = useTranslations('teamPage.remove');
  const tTeam = useTranslations('teamPage');
  const named = { email: email ?? tTeam('thisMember') };
  const { onConfirm, onConfirmed } = useTeamRowAction({
    done: t('done', named),
    gone: t('gone', named),
    failed: t('failed', named),
    refused: {
      [TEAM_REFUSAL.SELF]: t('self'),
      [TEAM_REFUSAL.LAST_OWNER]: t('lastOwner', named),
    },
  });

  return (
    <ConfirmDialog
      returnFocusId={TEAM_MEMBERS_HEADING_ID}
      onConfirm={() =>
        onConfirm(removeTeamMemberAction(tenantId, membershipId))
      }
      onConfirmed={onConfirmed}
    >
      <ConfirmDialog.Trigger
        variant={BUTTON_VARIANT.GHOST}
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
