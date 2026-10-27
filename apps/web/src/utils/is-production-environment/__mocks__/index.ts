import type * as TModule from '@web/utils/is-production-environment';

export const isProductionEnvironment = vi.fn<
  typeof TModule.isProductionEnvironment
>(() => false);
