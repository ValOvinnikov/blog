import { BRAND_VARIANT } from '@blog/config';
import type { THeroBlogModule } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeroPresentation } from '@web/testing/shared/hero-presentation/fixtures';

const mockFaker = createMockFaker(61049);

type TResolvedHeroBlogModule = Extract<THeroBlogModule, { hasPost: true }>;

type THeroBlogDataBase = Omit<TResolvedHeroBlogModule, 'hasPost' | 'heading'>;

const heroBlogDataBase: THeroBlogDataBase = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  eyebrow: undefined,
  supportingText: undefined,
  sanityImage: undefined,
  ctaButtons: [],
  presentation: mockHeroPresentation(),
  layout: undefined,
};

export const mockHeroBlogData = (
  overrides: Partial<Omit<TResolvedHeroBlogModule, 'hasPost'>> = {},
): TResolvedHeroBlogModule => ({
  ...heroBlogDataBase,
  hasPost: true,
  heading: 'Welcome',
  ...overrides,
});

export const mockUnresolvedHeroBlogData = (
  overrides: Partial<
    Omit<Extract<THeroBlogModule, { hasPost: false }>, 'hasPost'>
  > = {},
): THeroBlogModule => ({
  ...heroBlogDataBase,
  hasPost: false,
  isPostUntranslated: false,
  ...overrides,
});

/**
 * A `hasPost: false` result that still carries a `heading` — a shape the
 * union forbids but a stale service response could still produce at
 * runtime; models that case for tests exercising the `hasPost` guard.
 */
export const mockStaleUnresolvedHeroBlogData = (
  heading: string,
): THeroBlogModule =>
  ({
    ...heroBlogDataBase,
    hasPost: false,
    isPostUntranslated: false,
    heading,
  }) as THeroBlogModule;

export const MOCK_HERO_BLOG_MODULE_ID = mockFaker.string.uuid();
