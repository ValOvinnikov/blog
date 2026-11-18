import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import {
  MOCK_MISSING_ID,
  mockSlug,
} from '@shinefold/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';

import { redirectSourceQuery } from './query';

faker.seed(7575002);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_SOURCE = `/${mockSlug()}`;

const dataset = [
  {
    _id: MOCK_REDIRECT_ID,
    _type: 'redirect',
    language: NL,
    source: MOCK_SOURCE,
    destination: `/${mockSlug()}`,
    isPrefix: true,
  },
  {
    _id: faker.string.uuid(),
    _type: 'redirect',
    language: EN,
    source: `/${mockSlug()}`,
    destination: `/${mockSlug()}`,
  },
  { _id: MOCK_PAGE_ID, _type: 'page_landing', language: EN },
];

describe('redirectSourceQuery', () => {
  it.each([
    [
      'the redirect with the id',
      MOCK_REDIRECT_ID,
      { source: MOCK_SOURCE, language: NL, isPrefix: true },
    ],
    ['nothing for an id no document has', MOCK_MISSING_ID, null],
    ['nothing for an id that is not a redirect', MOCK_PAGE_ID, null],
  ])('resolves %s', async (_, id, expected) => {
    await expect(
      evaluateGroqExpression(redirectSourceQuery.query, dataset, undefined, {
        id,
      }),
    ).resolves.toEqual(expected);
  });
});
