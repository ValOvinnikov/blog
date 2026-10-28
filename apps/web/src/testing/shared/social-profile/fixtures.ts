import {
  SOCIAL_PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
  type TSocialPlatform,
} from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { faker } from '@faker-js/faker';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61065);

type TMockSocialProfileOverrides = Partial<Omit<TSocialProfile, 'link'>> & {
  link?: Partial<TSocialProfile['link']>;
};

export const mockSocialProfile = ({
  link,
  ...overrides
}: TMockSocialProfileOverrides = {}): TSocialProfile => ({
  platform: SOCIAL_PLATFORMS.GITHUB,
  link: {
    label: faker.company.name(),
    href: faker.internet.url(),
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
    ...link,
  },
  ...overrides,
});

const mockPlatformProfile = (platform: TSocialPlatform): TSocialProfile =>
  mockSocialProfile({
    platform,
    link: {
      label: SOCIAL_PLATFORM_LABEL[platform],
      href: mockFaker.internet.url(),
      target: '_blank',
    },
  });

export const MOCK_GITHUB_PROFILE = mockPlatformProfile(SOCIAL_PLATFORMS.GITHUB);

export const MOCK_LINKEDIN_PROFILE = mockPlatformProfile(
  SOCIAL_PLATFORMS.LINKEDIN,
);

export const MOCK_MASTODON_PROFILE = mockPlatformProfile(
  SOCIAL_PLATFORMS.MASTODON,
);
