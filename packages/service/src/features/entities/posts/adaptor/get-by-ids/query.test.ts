import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockRawPostCard } from '@shinefold/service/testing/pages/fixtures';
import { MOCK_MISSING_ID } from '@shinefold/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_SCHEDULED_NL_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
  toIds,
} from '@shinefold/service/testing/shared/translated-posts-dataset';

import { postsByIdsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

describe('postsByIdsQuery', () => {
  it('parses a post card with its language', () => {
    const raw = [{ ...mockRawPostCard(), language: EN }];

    expect(() => postsByIdsQuery.parse(raw)).not.toThrow();
  });

  it('resolves the given published posts whatever the request language', async () => {
    const posts = await evaluateGroqExpression(
      postsByIdsQuery.query,
      MOCK_TRANSLATED_POST_DOCUMENTS,
      undefined,
      {
        ids: [
          MOCK_DESIGN_EN_POST_ID,
          MOCK_DESIGN_NL_POST_ID,
          MOCK_SCHEDULED_NL_POST_ID,
          MOCK_MISSING_ID,
        ],
        locale: NL,
        defaultLocale: EN,
      },
    );

    expect(toIds(posts)).toEqual([
      MOCK_DESIGN_EN_POST_ID,
      MOCK_DESIGN_NL_POST_ID,
    ]);
  });
});
