import { InvoicesTable } from '@platform/components/features/billing/billing-page-content/components/invoices-table/invoices-table';
import { PlanCard } from '@platform/components/features/billing/billing-page-content/components/plan-card/plan-card';
import { Alert } from '@platform/components/shared/alert';
import { BILLING_OVERVIEW_STATE } from '@platform/constants/billing';
import { loadBillingOverview } from '@platform/server/billing/load-billing-overview';
import { hasStoredSubscription } from '@platform/server/billing/upgrade-state-for';
import { ALERT_TYPE, type TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TTenantStatus } from '@shinefold/db/constants';
import type { TTenantBilling } from '@shinefold/db/queries/tenants/tenant-billing';
import { getTranslations } from 'next-intl/server';

export type TBillingOverviewProps = {
  tenantId: string;
  plan: TTenantPlan;
  status: TTenantStatus;
  billing: TMaybeUndefined<TTenantBilling>;
};

export const BillingOverview = async ({
  tenantId,
  plan,
  status,
  billing,
}: TBillingOverviewProps) => {
  const [t, overview] = await Promise.all([
    getTranslations('billingPage'),
    loadBillingOverview(tenantId, billing),
  ]);

  if (overview.state === BILLING_OVERVIEW_STATE.UNAVAILABLE) {
    return (
      <Alert
        type={ALERT_TYPE.ERROR}
        title={t('unavailableTitle')}
        description={t('unavailableDescription')}
      />
    );
  }

  const isSubscribed = hasStoredSubscription({
    plan,
    stripeSubscriptionId: billing?.stripeSubscriptionId ?? null,
  });

  if (overview.state === BILLING_OVERVIEW_STATE.NO_CUSTOMER) {
    return (
      <PlanCard
        plan={plan}
        status={status}
        hasPayments={false}
        isSubscribed={isSubscribed}
      />
    );
  }

  const {
    renewal: { nextPayment, endsAt },
    invoices,
  } = overview;

  return (
    <>
      <PlanCard
        plan={plan}
        status={status}
        hasPayments={true}
        isSubscribed={isSubscribed}
        nextPayment={nextPayment}
        endsAt={endsAt}
      />
      <InvoicesTable invoices={invoices} />
    </>
  );
};
