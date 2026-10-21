import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';

import type { TDeprovisionEnv } from '../lib/env';

import { invalidateTenantCache } from './invalidate-tenant-cache';

vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');

const MISSING_CONFIG_ERROR =
  'invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET';

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ARCHIVED,
    provisioningStatus: null,
    provisioningSteps: null,
    seededAt: null,
    deprovisionedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

describe(invalidateTenantCache, () => {
  it("requests the purge of the tenant's cached pages", async () => {
    await invalidateTenantCache(baseTenant(), env);

    expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
      webAppUrl: env.webAppUrl,
      secret: env.siteConfigRevalidateSecret,
      tenantId: 'tenant-1',
    });
  });

  it('requests no purge in dry-run mode', async () => {
    await invalidateTenantCache(baseTenant(), { ...env, dryRun: true });

    expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
  });

  it('throws, requesting no purge, when WEB_APP_URL is missing', async () => {
    await expect(
      invalidateTenantCache(baseTenant(), { ...env, webAppUrl: undefined }),
    ).rejects.toThrow(MISSING_CONFIG_ERROR);

    expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
  });

  it('throws when SITE_CONFIG_REVALIDATE_SECRET is missing', async () => {
    await expect(
      invalidateTenantCache(baseTenant(), {
        ...env,
        siteConfigRevalidateSecret: undefined,
      }),
    ).rejects.toThrow(MISSING_CONFIG_ERROR);

    expect(requestTenantCacheInvalidation).not.toHaveBeenCalled();
  });
});
