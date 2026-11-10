import { HERO_VARIANT } from '@blog/config';
import type { THeroPresentation } from '@blog/service';

export const mockHeroPresentation = (
  overrides: Partial<THeroPresentation> = {},
): THeroPresentation => ({
  variant: HERO_VARIANT.SPLIT,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  ...overrides,
});
