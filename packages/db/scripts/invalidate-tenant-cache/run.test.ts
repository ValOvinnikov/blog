import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { runInvalidateTenantCache } from './run';

vi.mock('@blog/db/client');

const MOCK_CREATE_TENANT_FAILED = 'setup: createTenant failed.';
const MOCK_ARCHIVE_TENANT_FAILED = 'setup: archiveTenant failed.';

const fetchMock = vi.fn();

const env = {
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
  dryRun: false,
};

const db = useQueryTestDb();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock
    .mockReset()
    .mockResolvedValue(new Response(null, { status: HTTP_STATUS.OK }));
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db().delete(schema.tenants);
});

describe(runInvalidateTenantCache, () => {
  it('invalidates the cache for an already-archived tenant', async () => {
    const created = await createTenant({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error(MOCK_CREATE_TENANT_FAILED);

    const archived = await archiveTenant(created.data.id);
    if (!archived.ok) throw new Error(MOCK_ARCHIVE_TENANT_FAILED);
    expect(archived.data.deprovisionedAt).not.toBeNull();

    const result = await runInvalidateTenantCache(created.data.id, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      'https://web.example.com/api/revalidate-site-config',
    );
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer shared-secret',
    });
    expect(init.body).toBe(JSON.stringify({ tenantId: created.data.id }));
  });

  it('invalidates the cache for a still-active tenant too', async () => {
    const created = await createTenant({
      name: 'Still Active',
      primaryDomain: 'still-active.example.com',
      sanityProjectId: 'def456',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error(MOCK_CREATE_TENANT_FAILED);

    const result = await runInvalidateTenantCache(created.data.id, env);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports failure without throwing when the revalidation request fails', async () => {
    const created = await createTenant({
      name: 'Flaky',
      primaryDomain: 'flaky.example.com',
      sanityProjectId: 'ghi789',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error(MOCK_CREATE_TENANT_FAILED);
    const archived = await archiveTenant(created.data.id);
    if (!archived.ok) throw new Error(MOCK_ARCHIVE_TENANT_FAILED);

    fetchMock.mockResolvedValue(
      new Response('boom', { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    const result = await runInvalidateTenantCache(created.data.id, env);

    expect(result).toEqual({ ok: false });
  });

  it('rejects when the tenant id does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(runInvalidateTenantCache(missingId, env)).rejects.toThrow(
      `no "tenants" row for id "${missingId}"`,
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
