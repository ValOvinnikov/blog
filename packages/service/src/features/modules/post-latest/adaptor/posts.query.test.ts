import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { postLatestModulePostsQuery } from './posts.query';

const { EN, NL } = LOCALE_ISO_CODES;

async function run(limit: number, locale: string): Promise<string[]> {
  return toIds(
    await evaluateGroqExpression(
      postLatestModulePostsQuery(limit).query,
      MOCK_TRANSLATED_POST_DOCUMENTS,
      undefined,
      { locale, defaultLocale: EN },
    ),
  );
}

describe('postLatestModulePostsQuery', () => {
  it('lists published posts in the request language, newest first, up to the limit', async () => {
    expect(await run(2, EN)).toEqual([
      MOCK_ONLY_EN_POST_ID,
      MOCK_DESIGN_EN_POST_ID,
    ]);
    expect(await run(3, NL)).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });
});
