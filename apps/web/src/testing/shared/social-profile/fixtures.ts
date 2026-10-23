import { SOCIAL_PLATFORMS } from '@blog/config';
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
