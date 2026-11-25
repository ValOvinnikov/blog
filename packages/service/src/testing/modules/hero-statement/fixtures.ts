import { BRAND_VARIANT, HERO_VARIANT } from '@shinefold/config';
import type { TRawHeroStatementModule } from '@shinefold/service/features/modules/hero-statement/adaptor/transformer';
import { mockRawHeadingBlock } from '@shinefold/service/testing/shared/fixtures';

export function mockRawHeroStatementModule(
  overrides: Partial<TRawHeroStatementModule> = {},
): TRawHeroStatementModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: mockRawHeadingBlock('Statement heading'),
    image: null,
    ctaButtons: null,
    footnote: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mediaOrderSplit: null,
    mediaOrderStacked: null,
    layout: null,
    ...overrides,
  };
}
