import { Alert } from '@platform/components/shared/alert';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

import { PayInvoiceButton } from './components/pay-invoice-button/pay-invoice-button';

export type TPastDueNoticeProps = {
  tenantId: string;
  plan: TTenantPlan;
  canPay: boolean;
};

export const PastDueNotice = ({
  tenantId,
  plan,
  canPay,
}: TPastDueNoticeProps) => {
  const t = useTranslations('billingStatusNotice');
  const tPlan = useTranslations('planNames');

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('pastDueTitle')}
      description={t('pastDueDescription', { plan: tPlan(plan) })}
      action={canPay ? <PayInvoiceButton tenantId={tenantId} /> : undefined}
    />
  );
};
