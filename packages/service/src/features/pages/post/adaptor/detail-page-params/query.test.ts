import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postParamsQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function post(id: string, language: string, publishedAt: string) {
  return {
    _id: id,
    _type: 'page_post',
    slug: { current: id },
    language,
    publishedAt,
  };
}

describe('postParamsQuery', () => {
  it('lists the published posts in the live languages', async () => {
    const dataset = [
      post('hello', EN, '2026-01-01T00:00:00Z'),
      post('hallo', NL, '2026-01-02T00:00:00Z'),
      post('bonjour', FR, '2026-01-03T00:00:00Z'),
      post('later', EN, '2999-01-01T00:00:00Z'),
    ];

    expect(
      await evaluateGroqExpression(postParamsQuery.query, dataset, null, {
        locales: [EN, NL],
      }),
    ).toEqual([
      { slug: 'hello', language: EN, publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'hallo', language: NL, publishedAt: '2026-01-02T00:00:00Z' },
    ]);
  });
});
