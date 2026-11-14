import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostPublishedAt } from './loader';
import { postPublishedAtQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(7384);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_PUBLISHED_AT = faker.date.future().toISOString();

const tenant = mockTenant();

describe(getPostPublishedAt, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(null);
  });

  it('resolves the post publish date', async () => {
    mockRun.mockResolvedValue({ publishedAt: MOCK_PUBLISHED_AT });

    const result = await getPostPublishedAt(MOCK_POST_ID, tenant);

    expect(result).toBe(MOCK_PUBLISHED_AT);
  });

  it('resolves undefined when the post does not exist', async () => {
    const result = await getPostPublishedAt(MOCK_POST_ID, tenant);

    expect(result).toBeUndefined();
  });

  it('resolves undefined when the post has no publish date', async () => {
    mockRun.mockResolvedValue({ publishedAt: null });

    const result = await getPostPublishedAt(MOCK_POST_ID, tenant);

    expect(result).toBeUndefined();
  });

  it('queries the id for the tenant without caching the read', async () => {
    await getPostPublishedAt(MOCK_POST_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(postPublishedAtQuery, {
      parameters: { id: MOCK_POST_ID },
      tenant,
      cache: 'no-store',
    });
  });
});
