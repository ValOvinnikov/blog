import { MOCK_MISSING_ID } from '@shinefold/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import {
  MOCK_PUBLISHED_AT_FUTURE,
  MOCK_SCHEDULED_NL_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@shinefold/service/testing/shared/translated-posts-dataset';

import { postPublishedAtQuery } from './query';

function evaluateFor(id: string) {
  return evaluateGroqExpression(
    postPublishedAtQuery.query,
    MOCK_TRANSLATED_POST_DOCUMENTS,
    undefined,
    { id },
  );
}

describe('postPublishedAtQuery', () => {
  it('resolves the date of a post scheduled for later', async () => {
    const result = await evaluateFor(MOCK_SCHEDULED_NL_POST_ID);

    expect(result).toEqual({ publishedAt: MOCK_PUBLISHED_AT_FUTURE });
  });

  it('resolves nothing for an id that is not a post', async () => {
    const result = await evaluateFor(MOCK_MISSING_ID);

    expect(result).toBeNull();
  });
});
