import type { TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import type { TTenantStatus } from '@blog/db/constants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TBillingNextPayment } from '@platform/server/billing/fetch-stripe-billing';
import { formatDate } from '@platform/utils/format-date/format-date';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useLocale, useTranslations } from 'next-intl';

export type TPlanCardProps = {
  plan: TTenantPlan;
  status: TTenantStatus;
  hasPayments: boolean;
  nextPayment?: TBillingNextPayment;
};

export const PlanCard = ({
  plan,
  status,
  hasPayments,
  nextPayment,
}: TPlanCardProps) => {
  const t = useTranslations('billingPage');
  const tPlan = useTranslations('planNames');
  const tStatus = useTranslations('tenantsTable.status');
  const locale = useLocale();

  const nextPaymentText = (payment: TMaybeUndefined<TBillingNextPayment>) =>
    payment
      ? t.rich('nextPayment', {
          amount: formatStripeAmount(payment.amount, locale),
          date: formatDate(payment.dueAt, locale),
          time: (chunks) => (
            <time dateTime={payment.dueAt.toISOString()}>{chunks}</time>
          ),
        })
      : t('noNextPayment');

  return (
    <Card>
      <Card.Header
        title={t('planTitle')}
        supportingText={t('planDescription')}
        actions={
          <StatusBadge tone={tenantStatusTone(status)}>
            {tStatus(status)}
          </StatusBadge>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('planLabel')}>{tPlan(plan)}</DetailList.Row>
          {hasPayments && (
            <DetailList.Row label={t('nextPaymentLabel')}>
              {nextPaymentText(nextPayment)}
            </DetailList.Row>
          )}
        </DetailList>
        {!hasPayments && <Text>{t('noPayments')}</Text>}
      </Card.Body>
    </Card>
  );
};
