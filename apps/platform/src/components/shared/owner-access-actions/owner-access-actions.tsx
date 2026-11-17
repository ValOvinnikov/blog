'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { checkOwnerAccessAction } from '@platform/server/owner-access/check-owner-access-action';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { resendOwnerInviteAction } from '@platform/server/owner-access/resend-owner-invite-action';
import {
  settleAction,
  type TUnreachedAction,
} from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess, SIZE } from '@shinefold/config';
import {
  STUDIO_ACCESS,
  type TPendingStudioAccess,
} from '@shinefold/config/constants';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { ownerAccessActionsVariants } from './owner-access-actions-variants';

const ACTION_BUTTON_DEFAULTS = { size: SIZE.SM } as const;

export type TOwnerAccessActionsProps = {
  tenantId: string;
  studioAccess: TPendingStudioAccess;
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

  const isInviteSent = studioAccess === STUDIO_ACCESS.INVITE_SENT;
  const isStalled = studioAccess === STUDIO_ACCESS.STALLED;

  const settle = (
    result: TOwnerAccessRequestResult | TUnreachedAction,
    successKey: string,
  ) => {
    if (!isOutcomeSuccess(result)) {
      toast.error({ message: t('requestFailed') });
      return;
    }
    toast.success({ message: t(successKey) });
    router.refresh();
  };

  const handleCheck = () => {
    startCheck(async () => {
      settle(
        await settleAction(checkOwnerAccessAction(tenantId)),
        'checkStarted',
      );
    });
  };

  const handleResend = () => {
    startResend(async () => {
      settle(
        await settleAction(resendOwnerInviteAction(tenantId)),
        'inviteResent',
      );
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
