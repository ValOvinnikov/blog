'use client';

import { ACTION_OUTCOME, SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { removeCustomDomainAction } from '@platform/server/custom-domain/remove-custom-domain-action';
import { requestCustomDomainCardFocus } from '@platform/utils/custom-domain-focus/custom-domain-focus';
import { CUSTOM_DOMAIN_REFUSAL_KEYS } from '@platform/utils/custom-domain-keys/custom-domain-keys';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TRemoveCustomDomainControlProps = {
  tenantId: string;
  domain: string;
};

export const RemoveCustomDomainControl = ({
  tenantId,
  domain,
}: TRemoveCustomDomainControlProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const router = useRouter();

  const confirm = async () => {
    const result = await removeCustomDomainAction(tenantId, { domain });

    switch (result.outcome) {
      case ACTION_OUTCOME.SUCCESS:
        return okResult();
      case ACTION_OUTCOME.INVALID:
        return errorResult(t('invalidInput'));
      case ACTION_OUTCOME.REFUSED:
        return errorResult(
          t(`refusal.${CUSTOM_DOMAIN_REFUSAL_KEYS[result.reason]}`),
        );
      case ACTION_OUTCOME.SERVER_ERROR:
        return errorResult(t('removeFailed'));
    }
  };

  const handleConfirmed = () => {
    requestCustomDomainCardFocus();
    router.refresh();
  };

  return (
    <ConfirmDialog onConfirm={confirm} onConfirmed={handleConfirmed}>
      <ConfirmDialog.Trigger size={SIZE.SM}>
        {t('remove')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('removeTitle')}
        description={t('removeDescription', { domain })}
        confirmButtonLabel={t('removeConfirm')}
        confirmingButtonLabel={t('removing')}
      />
    </ConfirmDialog>
  );
};
