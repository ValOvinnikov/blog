import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TOPIC_ID } from '@blog/service/testing/entities/fixtures';
import {
  evaluateRelatedPostsQuery,
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { relatedByTopicQuery } from './by-topic.query';

describe('relatedByTopicQuery', () => {
  it('bounds the candidate pool by the given limit', () => {
    expect(relatedByTopicQuery(6).query).toContain('[0...6]');
    expect(relatedByTopicQuery(12).query).toContain('[0...12]');
  });
});

describe('relatedByTopicQuery language scoping', () => {
  const { EN, NL } = LOCALE_ISO_CODES;

  it('picks topic candidates only in the request language', async () => {
    expect(
      toIds(
        await evaluateRelatedPostsQuery(relatedByTopicQuery(10).query, {
          topicId: MOCK_TOPIC_ID,
          locale: EN,
        }),
      ),
    ).toEqual([MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID]);
  });

  it('leaves out a scheduled topic candidate', async () => {
    expect(
      toIds(
        await evaluateRelatedPostsQuery(relatedByTopicQuery(10).query, {
          topicId: MOCK_TOPIC_ID,
          locale: NL,
        }),
      ),
    ).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });
});
