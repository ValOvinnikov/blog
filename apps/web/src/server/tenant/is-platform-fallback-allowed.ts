import { isProductionEnvironment } from '@web/utils/is-production-environment';

export const isPlatformFallbackAllowed = (): boolean =>
  !isProductionEnvironment();
