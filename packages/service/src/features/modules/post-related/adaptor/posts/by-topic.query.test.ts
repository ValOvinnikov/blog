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

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_CANDIDATE_LIMIT = 10;

describe(relatedByTopicQuery, () => {
  it('picks topic candidates only in the request language', async () => {
    const raw = await evaluateRelatedPostsQuery(
      relatedByTopicQuery(MOCK_CANDIDATE_LIMIT).query,
      { topicId: MOCK_TOPIC_ID, locale: EN },
    );

    expect(toIds(raw)).toEqual([MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID]);
  });

  it('leaves out a scheduled topic candidate', async () => {
    const raw = await evaluateRelatedPostsQuery(
      relatedByTopicQuery(MOCK_CANDIDATE_LIMIT).query,
      { topicId: MOCK_TOPIC_ID, locale: NL },
    );

    expect(toIds(raw)).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });

  it('bounds the candidate pool by the given limit', async () => {
    const raw = await evaluateRelatedPostsQuery(relatedByTopicQuery(1).query, {
      topicId: MOCK_TOPIC_ID,
      locale: EN,
    });

    expect(toIds(raw)).toEqual([MOCK_ONLY_EN_POST_ID]);
  });
});
