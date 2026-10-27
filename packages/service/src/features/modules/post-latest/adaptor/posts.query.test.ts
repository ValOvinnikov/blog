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

describe(postLatestModulePostsQuery, () => {
  it.each([
    [2, EN, [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID]],
    [3, NL, [MOCK_DESIGN_NL_POST_ID]],
  ])(
    'lists up to %i newest published posts in the %s language',
    async (limit, locale, expected) => {
      const ids = await run(limit, locale);

      expect(ids).toEqual(expected);
    },
  );
});
