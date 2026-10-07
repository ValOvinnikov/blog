import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { publishedPostsInLocale } from './published-posts-in-locale';

const { EN, NL } = LOCALE_ISO_CODES;

async function idsIn(locale: string): Promise<string[]> {
  const query = publishedPostsInLocale(q.parameters<TLocaleQueryParams>().star);
  const posts = await evaluateGroqExpression(
    query.query,
    translatedPostDocuments,
    null,
    { locale, defaultLocale: EN },
  );

  return toIds(posts).sort();
}

describe('publishedPostsInLocale', () => {
  it('keeps only published posts written in the reader language', async () => {
    expect(await idsIn(EN)).toEqual(['design-en', 'notes-en', 'only-en']);
  });

  it('leaves out posts scheduled for the future', async () => {
    expect(await idsIn(NL)).toEqual(['design-nl']);
  });
});
