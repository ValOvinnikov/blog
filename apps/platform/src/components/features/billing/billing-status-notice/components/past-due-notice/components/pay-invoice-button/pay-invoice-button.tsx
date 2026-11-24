'use client';

import { Button } from '@platform/components/shared/button';
import { useToast } from '@platform/context/toast-provider';
import { payOpenInvoiceAction } from '@platform/server/billing/pay-open-invoice-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TPayInvoiceButtonProps = {
  tenantId: string;
};

export const PayInvoiceButton = ({ tenantId }: TPayInvoiceButtonProps) => {
  const t = useTranslations('billingStatusNotice');
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await settleAction(payOpenInvoiceAction(tenantId));

      toast.error({ message: t('pastDueActionFailed') });
    });
  };

  return (
    <Button
      size={SIZE.SM}
      isPending={isPending}
      pendingLabel={t('pastDueActionPending')}
      onClick={handleClick}
    >
      {t('pastDueAction')}
    </Button>
  );
};
