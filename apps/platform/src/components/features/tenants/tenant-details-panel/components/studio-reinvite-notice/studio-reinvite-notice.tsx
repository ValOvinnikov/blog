'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { useResendStudioInvite } from '@platform/components/features/tenants/tenant-details-panel/use-resend-studio-invite';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TStudioReinviteNoticeProps = {
  tenantId: string;
};

export const StudioReinviteNotice = ({
  tenantId,
}: TStudioReinviteNoticeProps) => {
  const t = useTranslations('tenantDetailsPanel');
  const resendStudioInvite = useResendStudioInvite(tenantId);
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    startTransition(resendStudioInvite);
  };

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      description={t('studioInviteUnsentNotice')}
      action={
        <Button
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
          onClick={handleResend}
          isPending={isPending}
        >
          {t('resendStudioInvite')}
        </Button>
      }
    />
  );
};
