import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import { faker } from '@faker-js/faker';

import { requestTenantCacheInvalidation } from './request-tenant-cache-invalidation';

faker.seed(3318);

const REVALIDATE_ENDPOINT_PATH = '/api/revalidate-site-config';
const MOCK_REFUSAL_BODY = faker.lorem.words(2);
const MOCK_REQUEST = {
  webAppUrl: faker.internet.url({ appendSlash: false }),
  secret: faker.string.alphanumeric(16),
  tenantId: faker.string.uuid(),
};

const fetchMock = useFetchFake();

beforeEach(() => {
  fetchMock.mockResolvedValue(emptyResponse());
});

describe(requestTenantCacheInvalidation, () => {
  it('POSTs the tenant id to the revalidation endpoint with the bearer secret', async () => {
    await requestTenantCacheInvalidation(MOCK_REQUEST);

    const { url, method, headers, body } = firstFetchCall(fetchMock);
    expect(String(url)).toBe(
      `${MOCK_REQUEST.webAppUrl}${REVALIDATE_ENDPOINT_PATH}`,
    );
    expect(method).toBe(HTTP_METHOD.POST);
    expect(headers).toEqual({ Authorization: `Bearer ${MOCK_REQUEST.secret}` });
    expect(body).toEqual({ tenantId: MOCK_REQUEST.tenantId });
  });

  it('throws with the status when the endpoint responds non-2xx', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_REFUSAL_BODY, HTTP_STATUS.UNAUTHORIZED),
    );

    await expect(requestTenantCacheInvalidation(MOCK_REQUEST)).rejects.toThrow(
      `Tenant cache invalidation failed for tenant "${MOCK_REQUEST.tenantId}": ${HTTP_STATUS.UNAUTHORIZED} ${MOCK_REFUSAL_BODY}`,
    );
  });
});
