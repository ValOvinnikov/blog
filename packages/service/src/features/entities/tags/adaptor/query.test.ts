import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRawTagWithPostCount } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqIds } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';

import { tagsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

const BRAVO_TAG_ID = 'tag-bravo';
const APEX_TAG_ID = 'tag-apex';

const TAG_DOCUMENTS = [
  {
    _id: BRAVO_TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings({ [EN]: 'Bravo', [NL]: 'Alef' }),
  },
  {
    _id: APEX_TAG_ID,
    _type: 'blog_tag',
    title: mockLocalizedStrings({ [EN]: 'Apex', [NL]: 'Zeta' }),
  },
];

function idsIn(locale: string): Promise<string[]> {
  return evaluateGroqIds(tagsQuery.query, TAG_DOCUMENTS, {
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

  it('orders tags by their title in the requested language', async () => {
    expect(await idsIn(EN)).toEqual([APEX_TAG_ID, BRAVO_TAG_ID]);
    expect(await idsIn(NL)).toEqual([BRAVO_TAG_ID, APEX_TAG_ID]);
  });
});
