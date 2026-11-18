import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockSlug } from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getRedirectSource } from './loader';
import { redirectSourceQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(7575001);

const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_SOURCE = `/${mockSlug()}`;
const { NL } = LOCALE_ISO_CODES;

describe(getRedirectSource, () => {
  it.each([
    [
      'the source, language and prefix flag of a redirect',
      { source: MOCK_SOURCE, language: NL, isPrefix: true },
      { source: MOCK_SOURCE, language: NL, isPrefix: true },
    ],
    [
      'a redirect with no prefix flag as exact',
      { source: MOCK_SOURCE, language: NL, isPrefix: null },
      { source: MOCK_SOURCE, language: NL, isPrefix: false },
    ],
    ['undefined when no published redirect has the id', null, undefined],
  ])('resolves %s', async (_, raw, expected) => {
    mockRun.mockResolvedValueOnce(raw);

    await expect(
      getRedirectSource(MOCK_REDIRECT_ID, MOCK_TENANT),
    ).resolves.toEqual(expected);
  });

  it('queries the id for the tenant without caching the read', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getRedirectSource(MOCK_REDIRECT_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(redirectSourceQuery, {
      parameters: { id: MOCK_REDIRECT_ID },
      tenant: MOCK_TENANT,
      cache: 'no-store',
    });
  });
});
