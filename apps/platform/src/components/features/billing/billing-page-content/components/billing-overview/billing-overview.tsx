import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import type { TTenantPlan, TTenantStatus } from '@blog/db/constants';
import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import { InvoicesTable } from '@platform/components/features/billing/billing-page-content/components/invoices-table/invoices-table';
import { PlanCard } from '@platform/components/features/billing/billing-page-content/components/plan-card/plan-card';
import { Alert } from '@platform/components/shared/alert';
import { BILLING_OVERVIEW_STATE } from '@platform/constants/billing';
import { loadBillingOverview } from '@platform/server/billing/load-billing-overview';
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
    loadBillingOverview(tenantId, plan, billing),
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

  if (overview.state === BILLING_OVERVIEW_STATE.NO_CUSTOMER) {
    return <PlanCard plan={plan} status={status} hasPayments={false} />;
  }

  const { nextPayment, invoices } = overview;

  return (
    <>
      <PlanCard
        plan={plan}
        status={status}
        hasPayments={true}
        nextPayment={nextPayment}
      />
      <InvoicesTable invoices={invoices} />
    </>
  );
};
