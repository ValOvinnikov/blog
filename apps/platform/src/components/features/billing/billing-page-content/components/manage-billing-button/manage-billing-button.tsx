'use client';

import { isOutcomeRefused } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useToast } from '@platform/context/toast-provider';
import { openBillingPortalAction } from '@platform/server/billing/open-billing-portal-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TManageBillingButtonProps = {
  tenantId: string;
};

export const ManageBillingButton = ({
  tenantId,
}: TManageBillingButtonProps) => {
  const t = useTranslations('billingPage');
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await settleAction(openBillingPortalAction(tenantId));

      toast.error({
        message: t(isOutcomeRefused(result) ? 'noCustomer' : 'manageFailed'),
      });
    });
  };

  return (
    <Button
      variant={BUTTON_VARIANT.PRIMARY}
      isPending={isPending}
      pendingLabel={t('managePending')}
      onClick={handleClick}
    >
      {t('manage')}
    </Button>
  );
};
