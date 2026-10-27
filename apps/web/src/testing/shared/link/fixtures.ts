import { routes, type ILink } from '@blog/config';
import { faker } from '@faker-js/faker';

faker.seed(61057);

const [HOME_LABEL, BLOG_LABEL, ABOUT_LABEL, TOPICS_LABEL] =
  faker.helpers.uniqueArray(faker.lorem.word, 4);

const mockNavLink = (label: string, href: string): ILink => ({
  label,
  href,
  target: undefined,
  platform: undefined,
  ariaLabel: undefined,
});

export const MOCK_HOME_LINK = mockNavLink(HOME_LABEL!, routes.home());

export const MOCK_BLOG_LINK = mockNavLink(BLOG_LABEL!, routes.blogIndex());

export const MOCK_ABOUT_LINK = mockNavLink(
  ABOUT_LABEL!,
  routes.landingPage(faker.lorem.slug()),
);

export const MOCK_TOPICS_LINK = mockNavLink(TOPICS_LABEL!, routes.topics());
