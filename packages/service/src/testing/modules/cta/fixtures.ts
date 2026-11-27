import { BRAND_VARIANT, CTA_VARIANT } from '@shinefold/config';
import type { TRawCtaModule } from '@shinefold/service/features/modules/cta/adaptor/transformer';
import { INBOX_SUPPORTING_TEXT } from '@shinefold/service/testing/modules/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export function mockRawCtaModule(
  overrides: Partial<TRawCtaModule> = {},
): TRawCtaModule {
  return {
    variant: CTA_VARIANT.CALLOUT,
    brandVariant: BRAND_VARIANT.PRIMARY,
    bandTone: BRAND_VARIANT.PRIMARY,
    eyebrow: null,
    headingBlock: mockRawModuleHeadingBlock('Subscribe to the newsletter', {
      supportingText: INBOX_SUPPORTING_TEXT,
    }),
    content: null,
    image: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mobileMediaOrder: null,
    ctaButtons: null,
    footnote: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
