import { faker } from '@faker-js/faker';

const mockPublishedDate = faker.date.past();

export const MOCK_PUBLISHED_AT = mockPublishedDate.toISOString();

export const MOCK_FORMATTED_DATE = mockPublishedDate.toLocaleDateString(
  'en-GB',
  { year: 'numeric', month: 'long', day: 'numeric' },
);

export const MOCK_POST_TITLE = 'Building a Design System';

export const MOCK_POST_EXCERPT =
  'A walkthrough of Atomic Design with Tailwind.';

export const MOCK_PERSON_NAME = 'Jane Doe';

export const MOCK_TOPIC = {
  label: 'Engineering',
  href: '/topics/engineering',
};

export const MOCK_TAG = {
  label: 'Architecture',
  href: '/topics/architecture',
};
