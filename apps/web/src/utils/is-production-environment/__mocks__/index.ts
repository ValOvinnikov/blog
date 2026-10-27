import type * as TModule from '@web/utils/is-production-environment';

export { PRODUCTION_DATASET } from '@web/utils/is-production-environment/is-production-environment';

export const isProductionEnvironment = vi.fn<
  typeof TModule.isProductionEnvironment
>(() => false);
