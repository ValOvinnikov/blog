import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';

import { requestTenantCacheInvalidation } from './request-tenant-cache-invalidation';

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

const REQUEST = {
  webAppUrl: 'https://cache-host.example.com',
  secret: 'cache-purge-secret',
  tenantId: 'cache-tenant',
};

beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock
    .mockReset()
    .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe(requestTenantCacheInvalidation, () => {
  it('POSTs the tenant id to the revalidation endpoint with the bearer secret', async () => {
    await requestTenantCacheInvalidation(REQUEST);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      `${REQUEST.webAppUrl}/api/revalidate-site-config`,
    );
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(init.headers).toEqual({
      Authorization: `Bearer ${REQUEST.secret}`,
    });
    expect(init.body).toBe(JSON.stringify({ tenantId: REQUEST.tenantId }));
  });

  it('throws with the status when the endpoint responds non-2xx', async () => {
    fetchMock.mockResolvedValue(
      new Response('revalidation refused', {
        status: HTTP_STATUS.UNAUTHORIZED,
      }),
    );

    await expect(requestTenantCacheInvalidation(REQUEST)).rejects.toThrow(
      `Tenant cache invalidation failed for tenant "${REQUEST.tenantId}": 401 revalidation refused`,
    );
  });
});
