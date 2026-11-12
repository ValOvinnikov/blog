'use client';

import { isOutcomeRefused, isOutcomeSuccess, SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
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

  const clear = async () => {
    const result = await settleAction(clearNewsletterPauseAction(tenantId));
    if (isOutcomeSuccess(result)) return okResult();

    return errorResult(
      t(isOutcomeRefused(result) ? 'alreadyCleared' : 'clearFailed'),
    );
  };

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.PRIMARY}
      onConfirm={clear}
      onConfirmed={() => router.refresh()}
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
