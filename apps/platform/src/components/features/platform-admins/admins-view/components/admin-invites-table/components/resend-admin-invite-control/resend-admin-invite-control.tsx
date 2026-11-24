'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { PLATFORM_ADMIN_REFUSAL } from '@platform/constants/platform-admins';
import { useToast } from '@platform/context/toast-provider';
import { resendAdminInviteAction } from '@platform/server/platform-admins/resend-admin-invite-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeRefused, isOutcomeSuccess, SIZE } from '@shinefold/config';
import { ADMIN_INVITE_LIFETIME_DAYS } from '@shinefold/db/constants';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TResendAdminInviteControlProps = {
  inviteId: string;
  email: string;
};

export const ResendAdminInviteControl = ({
  inviteId,
  email,
}: TResendAdminInviteControlProps) => {
  const t = useTranslations('resendAdminInviteControl');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const resend = () => {
    startTransition(async () => {
      const result = await settleAction(resendAdminInviteAction(inviteId));
      if (isOutcomeSuccess(result)) {
        toast.success({
          message: t('done', { email, days: ADMIN_INVITE_LIFETIME_DAYS }),
        });
        router.refresh();
        return;
      }
      if (isOutcomeRefused(result)) {
        toast.info({
          message: t(
            result.reason === PLATFORM_ADMIN_REFUSAL.ALREADY_ADMIN
              ? 'alreadyAdmin'
              : 'gone',
            { email },
          ),
        });
        router.refresh();
        return;
      }
      toast.error({ message: t('failed', { email }) });
    });
  };

  return (
    <Button
      variant={BUTTON_VARIANT.SECONDARY}
      size={SIZE.SM}
      isPending={isPending}
      pendingLabel={t('sending')}
      aria-label={t('triggerAriaLabel', { email })}
      onClick={resend}
    >
      {t('trigger')}
    </Button>
  );
};
