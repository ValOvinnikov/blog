import { routes, type ILink } from '@blog/config';
import { faker } from '@faker-js/faker';

const mockNavLink = (href: string): ILink => ({
  label: faker.lorem.word(),
  href,
  target: undefined,
  platform: undefined,
  ariaLabel: undefined,
});

export const MOCK_HOME_LINK = mockNavLink(routes.home());

export const MOCK_BLOG_LINK = mockNavLink(routes.blogIndex());

export const MOCK_ABOUT_LINK = mockNavLink(
  routes.landingPage(faker.lorem.slug()),
);

export const MOCK_TOPICS_LINK = mockNavLink(routes.topics());
