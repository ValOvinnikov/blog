import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import type { THeroBlogModule } from '@blog/service';

type THeroBlogDataBase = Omit<
  Extract<THeroBlogModule, { hasPost: true }>,
  'hasPost' | 'heading'
>;

const heroBlogDataBase: THeroBlogDataBase = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  supportingText: undefined,
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
};

export const makeHeroBlogData = (
  overrides: Partial<
    Omit<Extract<THeroBlogModule, { hasPost: true }>, 'hasPost'>
  > = {},
): THeroBlogModule => ({
  ...heroBlogDataBase,
  hasPost: true,
  heading: 'Welcome',
  ...overrides,
});

export const makeUnresolvedHeroBlogData = (
  overrides: Partial<
    Omit<Extract<THeroBlogModule, { hasPost: false }>, 'hasPost'>
  > = {},
): THeroBlogModule => ({
  ...heroBlogDataBase,
  hasPost: false,
  ...overrides,
});

/**
 * A `hasPost: false` result that still carries a `heading` — a shape the
 * union forbids but a stale service response could still produce at
 * runtime; models that case for tests exercising the `hasPost` guard.
 */
export const makeStaleUnresolvedHeroBlogData = (
  heading: string,
): THeroBlogModule =>
  ({
    ...heroBlogDataBase,
    hasPost: false,
    heading,
  }) as THeroBlogModule;
