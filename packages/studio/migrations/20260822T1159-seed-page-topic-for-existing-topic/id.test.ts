import { faker } from '@faker-js/faker';

import { toPageTopicId, toTopicPostListId } from './id';

faker.seed(21);

const MOCK_TOPIC_ID = faker.string.uuid();

describe(toPageTopicId, () => {
  it('derives the page_topic id from a blog_topic id', () => {
    expect(toPageTopicId(MOCK_TOPIC_ID)).toBe(`page_topic-${MOCK_TOPIC_ID}`);
  });
});

describe(toTopicPostListId, () => {
  it('derives the module_postList id from a blog_topic id', () => {
    expect(toTopicPostListId(MOCK_TOPIC_ID)).toBe(
      `postList-topic-${MOCK_TOPIC_ID}`,
    );
  });
});
