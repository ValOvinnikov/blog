import { TENANT_CONFIG_REVALIDATE_SECONDS } from '@blog/config';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { STRIPE_CATALOGUE_CACHE_TAG } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

const getCachedPlanPrices = unstable_cache(
  () => queries.stripeCatalogue.listStripePrices(),
  ['stripe-prices'],
  {
    tags: [STRIPE_CATALOGUE_CACHE_TAG],
    revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
  },
);

export const getPlanPrices = safeAsync(getCachedPlanPrices);
