import { routes, type ILink } from '@blog/config';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61057);

const [HOME_LABEL, BLOG_LABEL, ABOUT_LABEL, TOPICS_LABEL] =
  mockFaker.helpers.uniqueArray(mockFaker.lorem.word, 4);

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
  routes.landingPage(mockFaker.lorem.slug()),
);

export const MOCK_TOPICS_LINK = mockNavLink(TOPICS_LABEL!, routes.topics());

export const MOCK_TOPIC_CHILD_LINK = mockNavLink(
  `${mockFaker.lorem.word()}-child`,
  `${routes.topics()}/${mockFaker.lorem.slug()}`,
);

export const MOCK_TOPICS_WITH_SUB_ITEMS = {
  ...MOCK_TOPICS_LINK,
  subItems: [MOCK_TOPICS_LINK, MOCK_TOPIC_CHILD_LINK],
};
