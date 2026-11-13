import { Card } from '@platform/components/shared/card';
import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import { Skeleton } from '@platform/components/shared/skeleton';
import { PLAN_CARD_ROW_COUNT } from '@platform/constants/billing';

import { billingOverviewSkeletonVariants } from './billing-overview-skeleton-variants';

export const BillingOverviewSkeleton = () => {
  const { table } = billingOverviewSkeletonVariants();

  return (
    <>
      <DetailCardSkeleton rowCount={PLAN_CARD_ROW_COUNT} />
      <Card>
        <Skeleton className={table()} />
      </Card>
    </>
  );
};
