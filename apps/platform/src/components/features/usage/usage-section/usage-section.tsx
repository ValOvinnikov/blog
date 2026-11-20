import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import { USAGE_CARD_ROW_COUNT } from '@platform/constants/usage';
import { Suspense } from 'react';

import {
  type TUsageCardProps,
  UsageCard,
} from './components/usage-card/usage-card';

export const UsageSection = (props: TUsageCardProps) => (
  <Suspense fallback={<DetailCardSkeleton rowCount={USAGE_CARD_ROW_COUNT} />}>
    <UsageCard {...props} />
  </Suspense>
);
