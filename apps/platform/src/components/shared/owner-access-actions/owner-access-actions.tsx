'use client';

import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { checkOwnerAccessAction } from '@platform/server/owner-access/check-owner-access-action';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';
import { resendOwnerInviteAction } from '@platform/server/owner-access/resend-owner-invite-action';
import { checkMemberAccessAction } from '@platform/server/team/check-member-access-action';
import { resendMemberInviteAction } from '@platform/server/team/resend-member-invite-action';
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
  membershipId?: string;
  email?: string;
};

export const OwnerAccessActions = ({
  tenantId,
  studioAccess,
  membershipId,
  email,
}: TOwnerAccessActionsProps) => {
  const t = useTranslations('ownerStudioAccess');
  const toast = useToast();
  const router = useRouter();
  const [isChecking, startCheck] = useTransition();
  const [isResending, startResend] = useTransition();

  const isInviteSent = studioAccess === STUDIO_ACCESS.INVITE_SENT;
  const isStalled = studioAccess === STUDIO_ACCESS.STALLED;

  const named = email ? { email } : undefined;

  const settle = (
    result: TOwnerAccessRequestResult | TUnreachedAction,
    successMessage: string,
  ) => {
    if (!isOutcomeSuccess(result)) {
      toast.error({ message: t('requestFailed') });
      return;
    }
    toast.success({ message: successMessage });
    router.refresh();
  };

  const handleCheck = () => {
    startCheck(async () => {
      settle(
        await settleAction(
          membershipId
            ? checkMemberAccessAction(tenantId, membershipId)
            : checkOwnerAccessAction(tenantId),
        ),
        named ? t('checkStartedFor', named) : t('checkStarted'),
      );
    });
  };

  const handleResend = () => {
    startResend(async () => {
      settle(
        await settleAction(
          membershipId
            ? resendMemberInviteAction(tenantId, membershipId)
            : resendOwnerInviteAction(tenantId),
        ),
        named ? t('inviteResentTo', named) : t('inviteResent'),
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
      aria-label={named && t('checkNowAriaLabel', named)}
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
      aria-label={named && t('resendInviteAriaLabel', named)}
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
