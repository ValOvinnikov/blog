'use client';

import { ALERT_TYPE, isOutcomeSuccess, SIZE } from '@blog/config';
import type { TOAuthProvider } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { confirmSignInCallbackAction } from '@platform/server/sign-in-apps/confirm-sign-in-callback-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TSignInAppCallbackWarningProps = {
  provider: TOAuthProvider;
  domain: string;
  confirm?: { tenantId: string; onConfirmed: () => void };
};

export const SignInAppCallbackWarning = ({
  provider,
  domain,
  confirm,
}: TSignInAppCallbackWarningProps) => {
  const t = useTranslations('signInAppsPage');
  const tProvider = useTranslations('signInAppsPage.providerName');
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () =>
    startTransition(async () => {
      if (!confirm) return;
      const result = await settleAction(
        confirmSignInCallbackAction(confirm.tenantId, provider),
      );
      if (!isOutcomeSuccess(result)) {
        toast.error({ message: t('callbackConfirmFailed') });
        return;
      }
      confirm.onConfirmed();
      router.refresh();
    });

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      role="note"
      description={t('callbackWarning', {
        domain,
        provider: tProvider(provider),
      })}
      action={
        confirm && (
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            size={SIZE.SM}
            onClick={handleConfirm}
            isPending={isPending}
          >
            {t('callbackConfirm')}
          </Button>
        )
      }
    />
  );
};
