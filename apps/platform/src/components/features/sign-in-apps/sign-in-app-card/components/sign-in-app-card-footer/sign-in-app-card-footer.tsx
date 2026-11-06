'use client';

import { isOutcomeRefused, isOutcomeSuccess } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import type { TSignInAppForm } from '@platform/components/features/sign-in-apps/sign-in-app-card/use-sign-in-app-form';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { removeSignInAppAction } from '@platform/server/sign-in-apps/remove-sign-in-app-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useTranslations } from 'next-intl';

import { signInAppCardFooterVariants } from './sign-in-app-card-footer-variants';

export type TSignInAppCardFooterProps = {
  tenantId: string;
  form: TSignInAppForm;
  onRemoved: () => void;
};

export const SignInAppCardFooter = ({
  tenantId,
  form,
  onRemoved,
}: TSignInAppCardFooterProps) => {
  const t = useTranslations('signInAppsPage');
  const { provider, saved, hasSave, isPending, saveError, savedMessage, save } =
    form;
  const providerName = t(`providerName.${provider}`);
  const { status, saveButton } = signInAppCardFooterVariants();

  const remove = async () => {
    const result = await settleAction(
      removeSignInAppAction(tenantId, provider),
    );
    if (isOutcomeSuccess(result)) return okResult();
    return errorResult(
      isOutcomeRefused(result)
        ? t(`refusal.${result.reason}`)
        : t('removeDialog.failed'),
    );
  };

  return (
    <Card.Footer error={saveError}>
      {saved.hasOwnApp && (
        <ConfirmDialog onConfirm={remove} onConfirmed={onRemoved}>
          <ConfirmDialog.Trigger>{t('remove')}</ConfirmDialog.Trigger>
          <ConfirmDialog.Content
            title={t('removeDialog.title', { provider: providerName })}
            description={t('removeDialog.description', {
              provider: providerName,
            })}
            confirmButtonLabel={t('removeDialog.confirm')}
            confirmingButtonLabel={t('removeDialog.confirming')}
          />
        </ConfirmDialog>
      )}
      <span role="status" className={status()}>
        {savedMessage}
      </span>
      {hasSave && (
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          onClick={save}
          isPending={isPending}
          pendingLabel={t('saving')}
          className={saveButton()}
        >
          {t('save', { provider: providerName })}
        </Button>
      )}
    </Card.Footer>
  );
};
