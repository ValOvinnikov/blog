import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { postsByIdsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

describe('postsByIdsQuery', () => {
  it('parses a post card with its language', () => {
    const raw = [{ ...makeRawPostCard(), language: EN }];

    expect(() => postsByIdsQuery.parse(raw)).not.toThrow();
  });

  it('resolves the given published posts whatever the request language', async () => {
    const posts = await evaluateGroqExpression(
      postsByIdsQuery.query,
      translatedPostDocuments,
      undefined,
      {
        ids: ['design-en', 'design-nl', 'scheduled-nl', 'missing'],
        locale: NL,
        defaultLocale: EN,
      },
    );

    expect(toIds(posts)).toEqual(['design-en', 'design-nl']);
  });
});
