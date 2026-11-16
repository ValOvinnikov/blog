import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { MOCK_POST_ID } from '@shinefold/service/testing/shared/fixtures';
import { MOCK_PUBLISHED_AT_FUTURE } from '@shinefold/service/testing/shared/translated-posts-dataset';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getPostPublishedAt } from './loader';
import { postPublishedAtQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

describe(getPostPublishedAt, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(null);
  });

  it.each([
    [
      'the publish date of a post',
      { publishedAt: MOCK_PUBLISHED_AT_FUTURE },
      MOCK_PUBLISHED_AT_FUTURE,
    ],
    ['undefined when the post does not exist', null, undefined],
  ])('resolves %s', async (_, raw, expected) => {
    mockRun.mockResolvedValue(raw);

    const result = await getPostPublishedAt(MOCK_POST_ID, MOCK_TENANT);

    expect(result).toBe(expected);
  });

  it('queries the id for the tenant without caching the read', async () => {
    await getPostPublishedAt(MOCK_POST_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(postPublishedAtQuery, {
      parameters: { id: MOCK_POST_ID },
      tenant: MOCK_TENANT,
      cache: 'no-store',
    });
  });
});
