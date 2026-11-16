import { HERO_VARIANT } from '@shinefold/config';
import type { THeroPresentation } from '@shinefold/service';

export const mockHeroPresentation = (
  overrides: Partial<THeroPresentation> = {},
): THeroPresentation => ({
  variant: HERO_VARIANT.SPLIT,
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  ...overrides,
});
