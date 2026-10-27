import {
  BRAND_VARIANT,
  HERO_VARIANT,
  SITE_MESSAGES,
  SOCIAL_PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const MOCK_HERO_PROFILE_MODULE_ID = faker.string.uuid();

export const MOCK_HERO_PROFILE_AVATAR_NAME = 'Jamie Rivera';

export const MOCK_HERO_PROFILE_HEADING = faker.company.catchPhrase();

export const MOCK_GITHUB_PROFILE_LINK_NAME =
  SITE_MESSAGES.socialLinks.linkAriaLabel.replace(
    '{platform}',
    SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.GITHUB],
  );

export const mockHeroProfileModule = (
  overrides: Partial<THeroProfileModule> = {},
): THeroProfileModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: mockHeadingBlock({ heading: MOCK_HERO_PROFILE_HEADING }),
  avatarName: MOCK_HERO_PROFILE_AVATAR_NAME,
  sanityImage: undefined,
  bio: undefined,
  socialLinks: [],
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
  ...overrides,
});
