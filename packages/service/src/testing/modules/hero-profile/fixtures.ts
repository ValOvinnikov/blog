import { BRAND_VARIANT, HERO_VARIANT } from '@shinefold/config';
import type { TRawHeroProfileModule } from '@shinefold/service/features/modules/hero-profile/adaptor/transformer';
import { MOCK_AUTHOR_ID } from '@shinefold/service/testing/entities/fixtures';
import { MOCK_PERSON_NAME } from '@shinefold/service/testing/modules/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';

export function mockRawHeroProfileModule(
  overrides: Partial<TRawHeroProfileModule> = {},
): TRawHeroProfileModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: null,
    headingBlock: mockRawModuleHeadingBlock('Profile heading'),
    image: null,
    showSocialLinks: true,
    showRole: true,
    showBio: true,
    author: {
      _id: MOCK_AUTHOR_ID,
      name: MOCK_PERSON_NAME,
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: null,
    },
    ctaButtons: null,
    contentPositionSplit: null,
    contentPositionBanner: null,
    contentAlignment: null,
    mediaOrderSplit: null,
    layout: null,
    ...overrides,
  };
}
