import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TOPIC_ID } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { MOCK_TRANSLATED_POST_DOCUMENTS } from '@blog/service/testing/shared/translated-posts-dataset';

import { POST_COUNT_EXPRESSION, postCountParser } from './post-count';

const { EN, NL } = LOCALE_ISO_CODES;

describe('POST_COUNT_EXPRESSION', () => {
  it.each([
    { locale: EN, expected: 3 },
    { locale: NL, expected: 1 },
  ])(
    'counts the published posts referencing the document in $locale',
    async ({ locale, expected }) => {
      const count = await evaluateGroqExpression(
        `*[_id == "${MOCK_TOPIC_ID}"][0]{ "count": ${POST_COUNT_EXPRESSION} }.count`,
        MOCK_TRANSLATED_POST_DOCUMENTS,
        null,
        { locale },
      );

      expect(count).toBe(expected);
    },
  );
});

describe('postCountParser', () => {
  it('parses a count through as a number', () => {
    const count = postCountParser.parse(5);

    expect(count).toBe(5);
  });
});
