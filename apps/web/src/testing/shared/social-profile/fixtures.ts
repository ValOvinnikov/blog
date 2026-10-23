import { SOCIAL_PLATFORMS } from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { faker } from '@faker-js/faker';

export const mockSocialProfile = (
  overrides: Partial<TSocialProfile['link']> = {},
): TSocialProfile => ({
  platform: SOCIAL_PLATFORMS.GITHUB,
  link: {
    label: faker.company.name(),
    href: faker.internet.url(),
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
    ...overrides,
  },
});
