import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { BillingOverview } from '@platform/components/features/billing/billing-page-content/components/billing-overview/billing-overview';
import { BillingOverviewSkeleton } from '@platform/components/features/billing/billing-page-content/components/billing-overview-skeleton/billing-overview-skeleton';
import { ManageBillingButton } from '@platform/components/features/billing/billing-page-content/components/manage-billing-button/manage-billing-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { billingPageContentVariants } from './billing-page-content-variants';

export type TBillingPageContentProps = {
  tenant: TTenant;
};

export const BillingPageContent = async ({
  tenant,
}: TBillingPageContentProps) => {
  const { id, plan, status } = tenant;
  const [t, billing] = await Promise.all([
    getTranslations('billingPage'),
    queries.tenants.getTenantBilling(id),
  ]);
  const { root } = billingPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          billing?.stripeCustomerId ? (
            <ManageBillingButton tenantId={id} />
          ) : undefined
        }
      />
      <Suspense fallback={<BillingOverviewSkeleton />}>
        <BillingOverview
          tenantId={id}
          plan={plan}
          status={status}
          billing={billing}
        />
      </Suspense>
    </div>
  );
};
