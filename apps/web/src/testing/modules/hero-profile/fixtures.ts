import {
  BRAND_VARIANT,
  HERO_VARIANT,
  SITE_MESSAGES,
  SOCIAL_PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import type { THeroProfileModule } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { MOCK_TEAM_MEMBER_NAME } from '@web/testing/modules/team/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

const mockFaker = createMockFaker(61041);

export const MOCK_HERO_PROFILE_MODULE_ID = mockFaker.string.uuid();

export const MOCK_HERO_PROFILE_AVATAR_NAME = MOCK_TEAM_MEMBER_NAME;

export const MOCK_HERO_PROFILE_HEADING = mockFaker.company.catchPhrase();

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
