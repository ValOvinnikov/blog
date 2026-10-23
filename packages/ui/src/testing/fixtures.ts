import { faker } from '@faker-js/faker';

const mockPublishedDate = faker.date.past();

export const MOCK_PUBLISHED_AT = mockPublishedDate.toISOString();

export const MOCK_FORMATTED_DATE = mockPublishedDate.toDateString();

export const MOCK_POST_TITLE = 'Building a Design System';

export const MOCK_POST_EXCERPT =
  'A walkthrough of Atomic Design with Tailwind.';

export const MOCK_PERSON_NAME = 'Jane Doe';

const mockTopicSlug = faker.lorem.slug(1);

export const MOCK_TOPIC = {
  label: faker.lorem.word(),
  href: `/topics/${mockTopicSlug}`,
};

export const MOCK_TAG = {
  label: faker.lorem.words(2),
  href: `/tags/${faker.lorem.slug(2)}`,
};
