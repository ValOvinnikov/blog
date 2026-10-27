import {
  MOCK_TAG_ID,
  MOCK_TOPIC_ID,
} from '@blog/service/testing/entities/fixtures';
import {
  MOCK_POST_ID,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { relatedPostAnchorQuery } from './anchor.query';

faker.seed(12);

const MOCK_OTHER_POST_ID = faker.string.uuid();

const MOCK_DATASET = [
  { _id: MOCK_TOPIC_ID, _type: 'blog_topic' },
  { _id: MOCK_TAG_ID, _type: 'blog_tag' },
  {
    _id: MOCK_POST_ID,
    _type: 'page_post',
    topic: mockReference(MOCK_TOPIC_ID),
    tags: [mockReference(MOCK_TAG_ID, { _key: MOCK_TAG_ID })],
  },
  { _id: MOCK_OTHER_POST_ID, _type: 'page_post' },
];

describe('relatedPostAnchorQuery', () => {
  it('resolves the anchor post tag and topic ids by post id', async () => {
    const raw = await evaluateGroqExpression(
      relatedPostAnchorQuery.query,
      MOCK_DATASET,
      undefined,
      { postId: MOCK_POST_ID },
    );

    expect(relatedPostAnchorQuery.parse(raw)).toEqual({
      tagIds: [{ _id: MOCK_TAG_ID }],
      topicId: { _id: MOCK_TOPIC_ID },
    });
  });

  it('parses a missing anchor post as null', () => {
    expect(relatedPostAnchorQuery.parse(null)).toBeNull();
  });
});
