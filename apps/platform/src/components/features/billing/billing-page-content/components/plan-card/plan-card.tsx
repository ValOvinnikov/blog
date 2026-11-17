import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TBillingNextPayment } from '@platform/server/billing/fetch-stripe-billing';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { SIZE, type TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TTenantStatus } from '@shinefold/db/constants';
import { useLocale, useTranslations } from 'next-intl';

export type TPlanCardProps = {
  plan: TTenantPlan;
  status: TTenantStatus;
  hasPayments: boolean;
  isSubscribed: boolean;
  nextPayment?: TBillingNextPayment;
  endsAt?: Date;
};

export const PlanCard = ({
  plan,
  status,
  hasPayments,
  isSubscribed,
  nextPayment,
  endsAt,
}: TPlanCardProps) => {
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
          {hasPayments && !endsAt && (
            <DetailList.Row label={t('nextPaymentLabel')}>
              {nextPaymentText(nextPayment)}
            </DetailList.Row>
          )}
        </DetailList>
        {endsAt && <Text>{t.rich('planEnds', richDate(endsAt, locale))}</Text>}
        {!hasPayments && <Text>{t('noPayments')}</Text>}
      </Card.Body>
      {!endsAt && (
        <Card.Footer>
          <LinkButton href={adminRoutes.dashboardUpgrade()} size={SIZE.SM}>
            {isSubscribed ? t('changePlan') : t('upgrade')}
          </LinkButton>
        </Card.Footer>
      )}
    </Card>
  );
};
