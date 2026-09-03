import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { invalidateTenantCache } from './invalidate-tenant-cache';

const fetchMock = vi.fn();

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ARCHIVED',
    provisioningStatus: null,
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    deprovisionedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockResolvedValue(
    new Response(JSON.stringify({ revalidated: [], pathPurged: true }), {
      status: 200,
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(invalidateTenantCache, () => {
  it('POSTs the tenant id to the revalidation endpoint with the bearer secret', async () => {
    await invalidateTenantCache(baseTenant(), env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      'https://web.example.com/api/revalidate-site-config',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer shared-secret',
    });
    expect(init.body).toBe(JSON.stringify({ tenantId: 'tenant-1' }));
  });

  it('does not call the endpoint in dry-run mode', async () => {
    await invalidateTenantCache(baseTenant(), { ...env, dryRun: true });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws loudly when WEB_APP_URL is missing, without calling fetch', async () => {
    await expect(
      invalidateTenantCache(baseTenant(), { ...env, webAppUrl: undefined }),
    ).rejects.toThrow(
      'invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws loudly when SITE_CONFIG_REVALIDATE_SECRET is missing, without calling fetch', async () => {
    await expect(
      invalidateTenantCache(baseTenant(), {
        ...env,
        siteConfigRevalidateSecret: undefined,
      }),
    ).rejects.toThrow(
      'invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws and surfaces the status when the endpoint responds non-2xx', async () => {
    fetchMock.mockResolvedValue(
      new Response('secret mismatch', { status: 401 }),
    );

    await expect(invalidateTenantCache(baseTenant(), env)).rejects.toThrow(
      'invalidate-tenant-cache: revalidation request failed for tenant "tenant-1": 401',
    );
  });

  it('propagates a network failure rather than swallowing it', async () => {
    fetchMock.mockRejectedValue(new Error('fetch failed'));

    await expect(invalidateTenantCache(baseTenant(), env)).rejects.toThrow(
      'fetch failed',
    );
  });
});
