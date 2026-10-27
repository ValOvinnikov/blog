import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRawTagWithPostCount } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqIds } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { tagsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

faker.seed(6106);

const MOCK_BRAVO_TAG_ID = faker.string.uuid();
const MOCK_APEX_TAG_ID = faker.string.uuid();
const MOCK_BRAVO_TITLES = { [EN]: 'Bravo', [NL]: 'Alef' };
const MOCK_APEX_TITLES = { [EN]: 'Apex', [NL]: 'Zeta' };

const MOCK_TAG_DOCUMENTS = [
  {
    _id: MOCK_BRAVO_TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings(MOCK_BRAVO_TITLES),
  },
  {
    _id: MOCK_APEX_TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings(MOCK_APEX_TITLES),
  },
];

function idsIn(locale: string): Promise<string[]> {
  return evaluateGroqIds(tagsQuery.query, MOCK_TAG_DOCUMENTS, {
    locale,
    defaultLocale: EN,
  });
}

describe('tagsQuery', () => {
  it.each([
    ['a description', mockRawTagWithPostCount({ postCount: 5 })],
    ['no description', mockRawTagWithPostCount({ description: null })],
  ])('parses a tag with a post count and %s', (_, tag) => {
    expect(() => tagsQuery.parse([tag])).not.toThrow();
  });

  it.each([
    [EN, [MOCK_APEX_TAG_ID, MOCK_BRAVO_TAG_ID]],
    [NL, [MOCK_BRAVO_TAG_ID, MOCK_APEX_TAG_ID]],
  ])('orders tags by their %s title', async (locale, expectedIds) => {
    const ids = await idsIn(locale);

    expect(ids).toEqual(expectedIds);
  });
});
