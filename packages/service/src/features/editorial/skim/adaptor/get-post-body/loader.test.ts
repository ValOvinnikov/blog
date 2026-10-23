import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPublishedPostBody } from './loader';
import { publishedPostBodyQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const POST_ID = 'post-abc';

const tenant = mockTenant();

describe(getPublishedPostBody, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue({ body: [] });
  });

  it('returns the post body from the raw query result', async () => {
    const body = [{ _type: 'block', _key: 'b1', children: [] }];
    mockRun.mockResolvedValueOnce({ body });

    const result = await getPublishedPostBody(POST_ID, tenant);

    expect(result).toEqual(body);
  });

  it('queries the post id with tenant context and no ISR tags', async () => {
    await getPublishedPostBody(POST_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(publishedPostBodyQuery, {
      parameters: { id: POST_ID },
      tenant,
    });
  });

  it('propagates when no published post matches the id', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPublishedPostBody(MOCK_MISSING_ID, tenant),
    ).rejects.toThrow();
  });
});
