import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { evaluateGroqIds } from '@blog/service/testing/shared/groq';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_NOTES_EN_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { publishedPostsInLocale } from './published-posts-in-locale';

const { EN, NL } = LOCALE_ISO_CODES;

async function idsIn(locale: string): Promise<string[]> {
  const query = publishedPostsInLocale(q.parameters<TLocaleQueryParams>().star);
  const ids = await evaluateGroqIds(
    query.query,
    MOCK_TRANSLATED_POST_DOCUMENTS,
    {
      locale,
      defaultLocale: EN,
    },
  );

  return ids.sort();
}

describe(publishedPostsInLocale, () => {
  it('keeps only published posts written in the reader language', async () => {
    const ids = await idsIn(EN);

    expect(ids).toEqual([
      MOCK_DESIGN_EN_POST_ID,
      MOCK_NOTES_EN_POST_ID,
      MOCK_ONLY_EN_POST_ID,
    ]);
  });

  it('leaves out posts scheduled for the future', async () => {
    const ids = await idsIn(NL);

    expect(ids).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });
});
