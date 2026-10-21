'use client';

import { ACTION_OUTCOME, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { useToast } from '@platform/context/toast-provider';
import { checkOwnerAccessAction } from '@platform/server/owner-access/check-owner-access-action';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { resendOwnerInviteAction } from '@platform/server/owner-access/resend-owner-invite-action';
import { tv } from '@platform/utils/tv/tv';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const ownerAccessActionsVariants = tv({
  base: ['flex flex-wrap gap-2'],
});

export type TOwnerAccessActionsProps = {
  tenantId: string;
  canResend: boolean;
};

export const OwnerAccessActions = ({
  tenantId,
  canResend,
}: TOwnerAccessActionsProps) => {
  const t = useTranslations('ownerStudioAccess');
  const toast = useToast();
  const router = useRouter();
  const [isChecking, startCheck] = useTransition();
  const [isResending, startResend] = useTransition();

  const settle = (result: TOwnerAccessRequestResult, successKey: string) => {
    if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
      toast.error({ message: t('requestFailed') });
      return;
    }
    toast.success({ message: t(successKey) });
    router.refresh();
  };

  const handleCheck = () => {
    startCheck(async () => {
      settle(await checkOwnerAccessAction(tenantId), 'checkStarted');
    });
  };

  const handleResend = () => {
    startResend(async () => {
      settle(await resendOwnerInviteAction(tenantId), 'inviteResent');
    });
  };

  return (
    <div className={ownerAccessActionsVariants()}>
      <Button
        variant="primary"
        size={SIZE.SM}
        isDisabled={isResending}
        isPending={isChecking}
        pendingLabel={t('checking')}
        onClick={handleCheck}
      >
        {t('checkNow')}
      </Button>
      {canResend && (
        <Button
          variant="secondary"
          size={SIZE.SM}
          isDisabled={isChecking}
          isPending={isResending}
          pendingLabel={t('resending')}
          onClick={handleResend}
        >
          {t('resendInvite')}
        </Button>
      )}
    </div>
  );
};
