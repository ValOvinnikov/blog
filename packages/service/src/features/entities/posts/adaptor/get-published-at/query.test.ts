import { MOCK_MISSING_ID } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_PUBLISHED_AT_FUTURE,
  MOCK_SCHEDULED_NL_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { postPublishedAtQuery } from './query';

describe('postPublishedAtQuery', () => {
  it.each([
    [
      'the date of a post scheduled for later',
      MOCK_SCHEDULED_NL_POST_ID,
      { publishedAt: MOCK_PUBLISHED_AT_FUTURE },
    ],
    ['nothing for an id that is not a post', MOCK_MISSING_ID, null],
  ])('resolves %s', async (_, id, expected) => {
    const result = await evaluateGroqExpression(
      postPublishedAtQuery.query,
      MOCK_TRANSLATED_POST_DOCUMENTS,
      undefined,
      { id },
    );

    expect(result).toEqual(expected);
  });
});
