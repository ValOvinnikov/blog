import { HTTP_STATUS } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import {
  MOCK_INVALIDATE_CACHE_ENV,
  MOCK_SITE_CONFIG_REVALIDATE_SECRET,
  MOCK_WEB_APP_URL,
} from '@blog/db/testing/invalidate-tenant-cache/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  MOCK_TENANT_VALUES,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';

import { runInvalidateTenantCache } from './run';

vi.mock('@blog/db/client');

const REVALIDATE_SITE_CONFIG_PATH = '/api/revalidate-site-config';

const fetchMock = vi.fn();

const db = useQueryTestDb();

async function createActiveTenant() {
  return unwrapOk(
    await createTenant({ ...MOCK_TENANT_VALUES, status: TENANT_STATUS.ACTIVE }),
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db().delete(schema.tenants);
});

describe(runInvalidateTenantCache, () => {
  it('invalidates the cache for an already-archived tenant', async () => {
    const { id } = await createActiveTenant();
    unwrapOk(await archiveTenant(id));

    const result = await runInvalidateTenantCache(
      id,
      MOCK_INVALIDATE_CACHE_ENV,
    );

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(url.toString()).toBe(
      `${MOCK_WEB_APP_URL}${REVALIDATE_SITE_CONFIG_PATH}`,
    );
    expect(headers['Authorization']).toBe(
      `Bearer ${MOCK_SITE_CONFIG_REVALIDATE_SECRET}`,
    );
    expect(init.body).toBe(JSON.stringify({ tenantId: id }));
  });

  it('invalidates the cache for a still-active tenant too', async () => {
    const { id } = await createActiveTenant();

    const result = await runInvalidateTenantCache(
      id,
      MOCK_INVALIDATE_CACHE_ENV,
    );

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports failure without throwing when the revalidation request fails', async () => {
    const { id } = await createActiveTenant();
    unwrapOk(await archiveTenant(id));
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    const result = await runInvalidateTenantCache(
      id,
      MOCK_INVALIDATE_CACHE_ENV,
    );

    expect(result).toEqual({ ok: false });
  });

  it('rejects when the tenant id does not exist', async () => {
    await expect(
      runInvalidateTenantCache(
        MOCK_MISSING_TENANT_ID,
        MOCK_INVALIDATE_CACHE_ENV,
      ),
    ).rejects.toThrow(`no "tenants" row for id "${MOCK_MISSING_TENANT_ID}"`);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
