'use client';

import { ACTION_OUTCOME, SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { useLeadsTenantId } from '@platform/components/features/leads/leads-tenant-provider';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { LEAD_REFUSAL } from '@platform/constants/lead';
import { deleteLeadAction } from '@platform/server/leads/delete-lead-action';
import { useTranslations } from 'next-intl';

export type TDeleteLeadControlProps = {
  leadId: string;
  leadName: string;
  onDeleted: (leadId: string) => void;
};

export const DeleteLeadControl = ({
  leadId,
  leadName,
  onDeleted,
}: TDeleteLeadControlProps) => {
  const t = useTranslations('deleteLeadControl');
  const tenantId = useLeadsTenantId();

  const handleConfirm = async () => {
    const result = await deleteLeadAction(tenantId, leadId);
    if (result.outcome === ACTION_OUTCOME.SUCCESS) return okResult();

    const isGone =
      result.outcome === ACTION_OUTCOME.REFUSED &&
      result.reason === LEAD_REFUSAL.NOT_FOUND;
    if (isGone) onDeleted(leadId);
    return errorResult(t(isGone ? 'errors.notFound' : 'errors.failed'));
  };

  return (
    <ConfirmDialog
      onConfirm={handleConfirm}
      onConfirmed={() => onDeleted(leadId)}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
        ariaLabel={t('triggerAriaLabel', { name: leadName })}
      >
        {t('triggerButton')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('dialogTitle')}
        description={t('dialogDescription', { name: leadName })}
        confirmButtonLabel={t('confirmButton')}
        confirmingButtonLabel={t('confirmingButton')}
      />
    </ConfirmDialog>
  );
};
