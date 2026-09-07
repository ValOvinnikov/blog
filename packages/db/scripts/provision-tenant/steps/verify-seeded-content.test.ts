import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';
import { GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS } from '../lib/grant-propagation-retry';

import {
  verifyTenantSeededContent,
  type TVerifyTenantSeededContentDeps,
} from './verify-seeded-content';

const { getTenantSanityCredentialsMock } = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  getTenantSanityCredentials: getTenantSanityCredentialsMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  githubActor: undefined,
  tenantRegistryEnvironment: undefined,
  vercelWebProjectId: 'prj_web',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted-token',
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    seededAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

const baseCredentials = {
  projectId: 'proj123',
  dataset: 'production',
  token: 'sk-read',
  status: 'ACTIVE' as const,
  deprovisionedAt: null,
  provisioningStatus: 'PROVISIONING' as const,
};

function createClientStub(fetch: ReturnType<typeof vi.fn>) {
  const client = { fetch };
  return {
    fetch,
    createClient: vi
      .fn()
      .mockReturnValue(
        client,
      ) as unknown as TVerifyTenantSeededContentDeps['createClient'],
  };
}

function createClientStubResolving(foundTypes: string[]) {
  return createClientStub(vi.fn().mockResolvedValue(foundTypes));
}

beforeEach(() => {
  getTenantSanityCredentialsMock.mockReset();
});

describe(verifyTenantSeededContent, () => {
  it('passes when every required singleton is present', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
    const { createClient, fetch } = createClientStubResolving([
      'settings_site',
      'settings_navigation',
      'settings_footer',
    ]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(tenant, env, {
      createClient,
      getCredentials: getTenantSanityCredentialsMock,
      sleep,
    });

    expect(fetch).toHaveBeenCalledWith('*[_type in $types]._type', {
      types: ['settings_site', 'settings_navigation', 'settings_footer'],
    });
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj123',
        dataset: 'production',
        token: 'sk-read',
        useCdn: false,
      }),
    );
    expect(sleep).not.toHaveBeenCalled();
  });

  it('fails the run when a required singleton is absent', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
    const { createClient } = createClientStubResolving([
      'settings_navigation',
      'settings_footer',
    ]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, {
        createClient,
        getCredentials: getTenantSanityCredentialsMock,
        sleep,
      }),
    ).rejects.toThrow(/missing required starter document\(s\): settings_site/);
  });

  it('fails the run when the dataset has none of the required singletons', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
    const { createClient } = createClientStubResolving([]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, {
        createClient,
        getCredentials: getTenantSanityCredentialsMock,
        sleep,
      }),
    ).rejects.toThrow(
      /missing required starter document\(s\): settings_site, settings_navigation, settings_footer/,
    );
  });

  it('throws when the tenant has no persisted Sanity read token yet', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);
    const createClient = vi.fn();
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, {
        createClient,
        getCredentials: getTenantSanityCredentialsMock,
        sleep,
      }),
    ).rejects.toThrow(/has no persisted Sanity read token yet/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('retries a transient permission-denied read once and passes once it succeeds', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
    const grantError = new ClientError({
      statusCode: 403,
      headers: {},
      body: { message: 'Forbidden' },
      url: 'https://api.sanity.io/v2024-01-01/data/query/production',
      method: 'GET',
    });
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(grantError)
      .mockResolvedValueOnce([
        'settings_site',
        'settings_navigation',
        'settings_footer',
      ]);
    const { createClient } = createClientStub(fetch);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(tenant, env, {
      createClient,
      getCredentials: getTenantSanityCredentialsMock,
      sleep,
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied read and fails the run without reporting missing content', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
    const grantError = new ClientError({
      statusCode: 403,
      headers: {},
      body: { message: 'Forbidden' },
      url: 'https://api.sanity.io/v2024-01-01/data/query/production',
      method: 'GET',
    });
    const fetch = vi.fn().mockRejectedValue(grantError);
    const { createClient } = createClientStub(fetch);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, {
        createClient,
        getCredentials: getTenantSanityCredentialsMock,
        sleep,
      }),
    ).rejects.toThrow(grantError);

    expect(fetch).toHaveBeenCalledTimes(GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS);
  });
});
