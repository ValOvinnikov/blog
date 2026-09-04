import { env } from '@web/utils/env/env';

/**
 * The one discriminator for "is this the indexable production
 * environment?" — `NEXT_PUBLIC_SANITY_DATASET` is `production` only on the
 * real production deployment; every other environment (`development` after
 * a prod→dev dataset refresh, previews, etc.) serves content that must stay
 * out of search indexes even though it can be byte-identical to production.
 * The indexing gates in `robots.ts` and `[locale]/layout.tsx`'s
 * `generateMetadata` both read it, so they can never disagree.
 *
 * @example
 * isProductionEnvironment() // true only when NEXT_PUBLIC_SANITY_DATASET === 'production'
 */
export const isProductionEnvironment = (): boolean => {
  return env.NEXT_PUBLIC_SANITY_DATASET === 'production';
};
