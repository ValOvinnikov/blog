'use client';

import { SIZE } from '@blog/config';
import { useLeadsTenantId } from '@platform/components/features/leads/leads-tenant-provider';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { deleteLeadAction } from '@platform/server/leads/delete-lead-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TDeleteLeadControlProps = {
  leadId: string;
  leadName: string;
};

export const DeleteLeadControl = ({
  leadId,
  leadName,
}: TDeleteLeadControlProps) => {
  const t = useTranslations('deleteLeadControl');
  const router = useRouter();
  const tenantId = useLeadsTenantId();

  const handleConfirm = async () => {
    const result = await deleteLeadAction(tenantId, leadId);
    if (result.ok) return { ok: true } as const;

    const isGone = result.reason === 'notFound';
    if (isGone) router.refresh();
    return {
      ok: false,
      error: t(isGone ? 'errors.notFound' : 'errors.failed'),
    } as const;
  };

  return (
    <ConfirmDialog
      onConfirm={handleConfirm}
      onConfirmed={() => router.refresh()}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
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
