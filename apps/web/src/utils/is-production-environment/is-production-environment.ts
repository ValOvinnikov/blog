import { env } from '@web/utils/env/env';

export const PRODUCTION_DATASET = 'production';

// A refreshed dev dataset can be byte-identical to production, so the dataset name alone decides indexability.
export const isProductionEnvironment = (): boolean => {
  return env.NEXT_PUBLIC_SANITY_DATASET === PRODUCTION_DATASET;
};
