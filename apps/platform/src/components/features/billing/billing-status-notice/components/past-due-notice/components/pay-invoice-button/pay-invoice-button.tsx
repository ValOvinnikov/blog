'use client';

import { Button } from '@platform/components/shared/button';
import { NewTabHint } from '@platform/components/shared/new-tab-hint';
import { useToast } from '@platform/context/toast-provider';
import { payOpenInvoiceAction } from '@platform/server/billing/pay-open-invoice-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess, SIZE } from '@shinefold/config';
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
    // Opened before the action awaits, while the click still counts as a user gesture, so pop-up blockers allow it.
    const paymentTab = window.open('', '_blank');

    startTransition(async () => {
      const result = await settleAction(payOpenInvoiceAction(tenantId));

      if (!isOutcomeSuccess(result)) {
        paymentTab?.close();
        toast.error({ message: t('pastDueActionFailed') });
        return;
      }

      const url = new URL(result.url, window.location.href).toString();
      if (!paymentTab) {
        window.location.assign(url);
        return;
      }
      paymentTab.opener = null;
      paymentTab.location.assign(url);
    });
  };

  return (
    <Button
      size={SIZE.SM}
      isPending={isPending}
      pendingLabel={t('pastDueActionPending')}
      onClick={handleClick}
    >
      {t('pastDueAction')} <NewTabHint />
    </Button>
  );
};
