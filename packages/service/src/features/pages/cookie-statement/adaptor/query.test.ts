import { CONTENT_ALIGNMENT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRawCookieStatementPage } from '@blog/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { cookieStatementPageQuery } from './query';

faker.seed(65141);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_EN_ID = faker.string.uuid();
const MOCK_NL_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);

function mockCookieStatementDocument(_id: string, language: string) {
  return {
    _id,
    _type: 'page_cookieStatement',
    language,
    title: faker.lorem.words(2),
    content: [],
    seo: mockRawSeo(),
  };
}

const dataset = [
  mockCookieStatementDocument(MOCK_EN_ID, EN),
  {
    ...mockCookieStatementDocument(MOCK_NL_ID, NL),
    headingBlock: mockRawHeadingBlock(MOCK_HEADING),
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
];

function run(locale: string): Promise<unknown> {
  return evaluateGroqExpression(cookieStatementPageQuery.query, dataset, null, {
    locale,
    defaultLocale: EN,
  });
}

describe('cookieStatementPageQuery', () => {
  it.each([
    [EN, MOCK_EN_ID],
    [NL, MOCK_NL_ID],
  ])('loads the %s cookie statement', async (locale, id) => {
    expect(await run(locale)).toHaveProperty('_id', id);
  });

  it('lists every language the cookie statement exists in', async () => {
    expect(await run(NL)).toHaveProperty('translations', [
      { language: EN },
      { language: NL },
    ]);
  });

  it('projects the heading block and its alignment', async () => {
    expect(await run(NL)).toMatchObject({
      headingBlock: { heading: MOCK_HEADING },
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });
  });

  it('parses a cookie statement saved without a heading block', async () => {
    expect(cookieStatementPageQuery.parse(await run(EN))).toMatchObject({
      headingBlock: null,
      contentAlignment: null,
    });
  });

  it('resolves nothing in a language with no cookie statement', async () => {
    expect(await run(FR)).toBeNull();
  });

  it('parses null as no cookie statement', () => {
    expect(cookieStatementPageQuery.parse(null)).toBeNull();
  });

  it.each([['title'], ['body'], ['seo']])(
    'throws when the cookie statement has no %s',
    (field) => {
      const raw = { ...mockRawCookieStatementPage(), [field]: null };

      expect(() => cookieStatementPageQuery.parse(raw)).toThrow();
    },
  );
});
