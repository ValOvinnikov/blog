'use client';

import { isOutcomeSuccess, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  OWNER_STUDIO_ACCESS,
  type TPendingOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import { useToast } from '@platform/context/toast-provider';
import { checkOwnerAccessAction } from '@platform/server/owner-access/check-owner-access-action';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { resendOwnerInviteAction } from '@platform/server/owner-access/resend-owner-invite-action';
import { tv } from '@platform/utils/tv/tv';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const ACTION_BUTTON_DEFAULTS = { size: SIZE.SM } as const;

const ownerAccessActionsVariants = tv({
  base: ['flex flex-wrap gap-2'],
});

export type TOwnerAccessActionsProps = {
  tenantId: string;
  studioAccess: TPendingOwnerStudioAccess;
};

export const OwnerAccessActions = ({
  tenantId,
  studioAccess,
}: TOwnerAccessActionsProps) => {
  const t = useTranslations('ownerStudioAccess');
  const toast = useToast();
  const router = useRouter();
  const [isChecking, startCheck] = useTransition();
  const [isResending, startResend] = useTransition();

  const isInviteSent = studioAccess === OWNER_STUDIO_ACCESS.INVITE_SENT;
  const isStalled = studioAccess === OWNER_STUDIO_ACCESS.STALLED;

  const settle = (result: TOwnerAccessRequestResult, successKey: string) => {
    if (!isOutcomeSuccess(result)) {
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

  const checkButton = (
    <Button
      {...ACTION_BUTTON_DEFAULTS}
      variant={isInviteSent ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.SECONDARY}
      isDisabled={isResending}
      isPending={isChecking}
      pendingLabel={t('checking')}
      onClick={handleCheck}
    >
      {t('checkNow')}
    </Button>
  );

  const resendButton = (
    <Button
      {...ACTION_BUTTON_DEFAULTS}
      variant={isStalled ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.SECONDARY}
      isDisabled={isChecking}
      isPending={isResending}
      pendingLabel={t('resending')}
      onClick={handleResend}
    >
      {t('resendInvite')}
    </Button>
  );

  return (
    <div className={ownerAccessActionsVariants()}>
      {isStalled && resendButton}
      {checkButton}
      {isInviteSent && resendButton}
    </div>
  );
};
