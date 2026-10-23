import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { MOCK_TRANSLATED_POST_DOCUMENTS } from '@blog/service/testing/shared/translated-posts-dataset';

import { POST_COUNT_EXPRESSION, postCountParser } from './post-count';

const { EN, NL } = LOCALE_ISO_CODES;

describe('POST_COUNT_EXPRESSION', () => {
  it('counts published posts referencing the document in the request language', async () => {
    function count(locale: string): Promise<unknown> {
      return evaluateGroqExpression(
        `*[_id == "topic-1"][0]{ "count": ${POST_COUNT_EXPRESSION} }.count`,
        MOCK_TRANSLATED_POST_DOCUMENTS,
        null,
        { locale },
      );
    }

    expect(await count(EN)).toBe(3);
    expect(await count(NL)).toBe(1);
  });

  it('parses to a number', () => {
    expect(postCountParser.parse(5)).toBe(5);
  });
});
