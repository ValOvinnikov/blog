'use client';

import { ACTION_OUTCOME, SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIGNUP_BLOCK_REFUSAL } from '@platform/constants/signup-block';
import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';
import { removeBlockedIdentityAction } from '@platform/server/signup-block/remove-blocked-identity-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TRemoveBlockedIdentityControlProps = {
  entry: Pick<TBlockedSignupEntry, 'id' | 'displayValue'>;
};

export const RemoveBlockedIdentityControl = ({
  entry,
}: TRemoveBlockedIdentityControlProps) => {
  const t = useTranslations('removeBlockedIdentityControl');
  const router = useRouter();
  const { id, displayValue } = entry;

  const remove = async () => {
    const result = await removeBlockedIdentityAction(id);
    if (result.outcome === ACTION_OUTCOME.SUCCESS) return okResult();

    const isNotFound =
      result.outcome === ACTION_OUTCOME.REFUSED &&
      result.reason === SIGNUP_BLOCK_REFUSAL.ENTRY_NOT_FOUND;
    return errorResult(t(isNotFound ? 'alreadyRemoved' : 'removalFailed'));
  };

  return (
    <ConfirmDialog
      tone={BUTTON_VARIANT.DANGER}
      onConfirm={remove}
      onConfirmed={() => router.refresh()}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        ariaLabel={t('triggerAriaLabel', { value: displayValue })}
      >
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
