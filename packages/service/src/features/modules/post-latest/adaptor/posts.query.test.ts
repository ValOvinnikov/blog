import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { postLatestModulePostsQuery } from './posts.query';

const { EN, NL } = LOCALE_ISO_CODES;

async function run(limit: number, locale: string): Promise<string[]> {
  return toIds(
    await evaluateGroqExpression(
      postLatestModulePostsQuery(limit).query,
      translatedPostDocuments,
      undefined,
      { locale, defaultLocale: EN },
    ),
  );
}

describe('postLatestModulePostsQuery', () => {
  it('lists published posts in the request language, newest first, up to the limit', async () => {
    expect(await run(2, EN)).toEqual(['only-en', 'design-en']);
    expect(await run(3, NL)).toEqual(['design-nl']);
  });
});
