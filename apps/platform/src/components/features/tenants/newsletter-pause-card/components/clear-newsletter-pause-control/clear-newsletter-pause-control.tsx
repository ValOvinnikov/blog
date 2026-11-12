'use client';

import { isOutcomeRefused, isOutcomeSuccess, SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { useTenantOverviewFocus } from '@platform/components/features/tenants/tenant-overview-focus-provider';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { clearNewsletterPauseAction } from '@platform/server/newsletter-pause/clear-newsletter-pause-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
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

  const leaveCard = () => {
    focusHeading();
    router.refresh();
  };

  const clear = async () => {
    const result = await settleAction(clearNewsletterPauseAction(tenantId));
    if (isOutcomeSuccess(result)) return okResult();
    if (!isOutcomeRefused(result)) return errorResult(t('clearFailed'));

    router.refresh();
    return errorResult(t('alreadyCleared'));
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
