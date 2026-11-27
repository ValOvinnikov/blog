import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { UpgradeLinkButton } from '@platform/components/shared/upgrade-link-button';
import type {
  TBillingNextPayment,
  TBillingRenewal,
} from '@platform/server/billing/fetch-stripe-billing';
import type { TBillingAmountOwed } from '@platform/server/billing/read-amount-owed';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { formatStripeAmount, type TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TTenantStatus } from '@shinefold/db/constants';
import { useLocale, useTranslations } from 'next-intl';

export type TPlanCardProps = {
  plan: TTenantPlan;
  status: TTenantStatus;
  hasPayments: boolean;
  isSubscribed: boolean;
  renewal: TBillingRenewal;
  canChangePlan: boolean;
};

export const PlanCard = ({
  plan,
  status,
  hasPayments,
  isSubscribed,
  renewal,
  canChangePlan,
}: TPlanCardProps) => {
  const { nextPayment, amountOwed, endsAt } = renewal;
  const t = useTranslations('billingPage');
  const tPlan = useTranslations('planNames');
  const tStatus = useTranslations('tenantsTable.status');
  const locale = useLocale();

  const nextPaymentText = (payment: TMaybeUndefined<TBillingNextPayment>) =>
    payment
      ? t.rich('nextPayment', {
          amount: formatStripeAmount(payment.amount, locale),
          ...richDate(payment.dueAt, locale),
        })
      : t('noNextPayment');

  const amountOwedText = ({ amount, retryAt }: TBillingAmountOwed) => {
    const formattedAmount = formatStripeAmount(amount, locale);
    return retryAt
      ? t.rich('amountOverdueRetry', {
          amount: formattedAmount,
          ...richDate(retryAt, locale),
        })
      : t('amountOverdueNoRetry', { amount: formattedAmount });
  };

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
          {amountOwed && (
            <DetailList.Row label={t('amountOverdueLabel')}>
              {amountOwedText(amountOwed)}
            </DetailList.Row>
          )}
          {hasPayments && !endsAt && !amountOwed && (
            <DetailList.Row label={t('nextPaymentLabel')}>
              {nextPaymentText(nextPayment)}
            </DetailList.Row>
          )}
        </DetailList>
        {endsAt && <Text>{t.rich('planEnds', richDate(endsAt, locale))}</Text>}
        {!hasPayments && <Text>{t('noPayments')}</Text>}
      </Card.Body>
      {canChangePlan && !endsAt && (
        <Card.Footer>
          <UpgradeLinkButton>
            {isSubscribed ? t('changePlan') : t('upgrade')}
          </UpgradeLinkButton>
        </Card.Footer>
      )}
    </Card>
  );
};
