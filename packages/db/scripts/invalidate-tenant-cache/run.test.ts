import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { archiveTenant } from '@blog/db/queries/tenants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { runInvalidateTenantCache } from './run';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const fetchMock = vi.fn();

const env = {
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
  dryRun: false,
};

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db.delete(schema.tenants);
});

describe(runInvalidateTenantCache, () => {
  it('invalidates the cache for an already-archived tenant', async () => {
    const created = await createTenant({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error('setup: createTenant failed.');

    const archived = await archiveTenant(created.data.id);
    if (!archived.ok) throw new Error('setup: archiveTenant failed.');
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
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error('setup: createTenant failed.');

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
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error('setup: createTenant failed.');
    const archived = await archiveTenant(created.data.id);
    if (!archived.ok) throw new Error('setup: archiveTenant failed.');

    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

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
