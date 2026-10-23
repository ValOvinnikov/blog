import { SOCIAL_PLATFORM_LABEL, SOCIAL_PLATFORMS } from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { faker } from '@faker-js/faker';

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

export const MOCK_LINK_TARGET = '_blank';

export const MOCK_GITHUB_PROFILE: TSocialProfile = {
  platform: SOCIAL_PLATFORMS.GITHUB,
  link: {
    label: SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.GITHUB],
    href: faker.internet.url(),
    target: MOCK_LINK_TARGET,
    platform: undefined,
    ariaLabel: undefined,
  },
};

export const MOCK_LINKEDIN_PROFILE: TSocialProfile = {
  platform: SOCIAL_PLATFORMS.LINKEDIN,
  link: {
    label: SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.LINKEDIN],
    href: faker.internet.url(),
    target: MOCK_LINK_TARGET,
    platform: undefined,
    ariaLabel: undefined,
  },
};

export const MOCK_MASTODON_PROFILE: TSocialProfile = {
  platform: SOCIAL_PLATFORMS.MASTODON,
  link: {
    label: SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.MASTODON],
    href: faker.internet.url(),
    target: MOCK_LINK_TARGET,
    platform: undefined,
    ariaLabel: undefined,
  },
};
