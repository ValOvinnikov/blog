import { faker } from '@faker-js/faker';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getPublishedPostBody } from './loader';
import { publishedPostBodyQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6015101);

const MOCK_TENANT = mockTenant();
const MOCK_BODY = [{ _type: 'block', _key: faker.string.uuid(), children: [] }];

describe(getPublishedPostBody, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue({ body: [] });
  });

  it('returns the post body from the raw query result', async () => {
    mockRun.mockResolvedValueOnce({ body: MOCK_BODY });

    const result = await getPublishedPostBody(MOCK_POST_ID, MOCK_TENANT);

    expect(result).toEqual(MOCK_BODY);
  });

  it('queries the post id with tenant context and no ISR tags', async () => {
    await getPublishedPostBody(MOCK_POST_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(publishedPostBodyQuery, {
      parameters: { id: MOCK_POST_ID },
      tenant: MOCK_TENANT,
    });
  });

  it('propagates when no published post matches the id', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getPublishedPostBody(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });
});
