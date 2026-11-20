'use client';

import { useTenantOverviewFocus } from '@platform/components/features/tenants/tenant-overview-focus-provider';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { clearNewsletterPauseAction } from '@platform/server/newsletter-pause/clear-newsletter-pause-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeRefused, isOutcomeSuccess, SIZE } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TClearNewsletterPauseControlProps = {
  tenantId: string;
};

export const ClearNewsletterPauseControl = ({
  tenantId,
}: TClearNewsletterPauseControlProps) => {
  const t = useTranslations('newsletterPauseCard');
  const router = useRouter();
  const { focusHeading } = useTenantOverviewFocus();
  const toast = useToast();

  const leaveCard = () => {
    focusHeading();
    router.refresh();
  };

  const clear = async () => {
    const result = await settleAction(clearNewsletterPauseAction(tenantId));
    if (isOutcomeSuccess(result)) return okResult();
    if (!isOutcomeRefused(result)) return errorResult(t('clearFailed'));

    toast.info({ message: t('alreadyCleared') });
    return okResult();
  };

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.PRIMARY}
      onConfirm={clear}
      onConfirmed={leaveCard}
    >
      <ConfirmDialog.Trigger size={SIZE.SM}>
        {t('openDialogButton')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('dialogTitle')}
        description={t('dialogDescription')}
        confirmButtonLabel={t('confirmButton')}
        confirmingButtonLabel={t('confirmingButton')}
      />
    </ConfirmDialog>
  );
};
