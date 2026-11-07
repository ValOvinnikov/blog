'use client';

import { isOutcomeSuccess } from '@blog/config';
import { useToast } from '@platform/context/toast-provider';
import { resendChangedOwnerStudioInviteAction } from '@platform/server/tenants/resend-changed-owner-studio-invite-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export const useResendStudioInvite = (tenantId: string) => {
  const t = useTranslations('tenantDetailsPanel');
  const toast = useToast();
  const router = useRouter();

  return async () => {
    const result = await settleAction(
      resendChangedOwnerStudioInviteAction(tenantId),
    );
    if (isOutcomeSuccess(result)) {
      toast.success({ message: t('studioInviteResent') });
      router.refresh();
    } else {
      toast.error({ message: t('studioInviteResendFailed') });
    }
  };
};
