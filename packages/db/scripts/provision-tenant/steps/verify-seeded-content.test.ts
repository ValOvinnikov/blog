import type { TTenant } from '@blog/db/schema/tenants';
import { ClientError } from '@sanity/client';

import type { TProvisionEnv } from '../lib/env';

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

const REVALIDATE_WEBHOOK_URL = 'https://example.com/api/revalidate';

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

const VALID_HOME_PAGE = {
  headingBlock: { heading: 'Welcome to Acme' },
  seo: { metaTitle: 'Welcome to Acme — starter site' },
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

const VALID_NAVIGATION_ITEMS = [{ resolved: true }];

function createClientStubResolving(
  foundTypes: string[],
  homePage: unknown = VALID_HOME_PAGE,
  navigationItems: unknown = VALID_NAVIGATION_ITEMS,
) {
  return createClientStub(
    vi.fn().mockImplementation((query: string) => {
      if (query.includes('_type in $types')) {
        return Promise.resolve(foundTypes);
      }

      if (query.includes('settings_navigation')) {
        return Promise.resolve(navigationItems);
      }

      return Promise.resolve(homePage);
    }),
  );
}

function grantError(): ClientError {
  return new ClientError({
    statusCode: 403,
    headers: {},
    body: { message: 'Forbidden' },
    url: 'https://api.sanity.io/v2024-01-01/data/query/production',
    method: 'GET',
  });
}

function baseDeps(
  overrides: Partial<TVerifyTenantSeededContentDeps> = {},
): TVerifyTenantSeededContentDeps {
  const { createClient } = createClientStubResolving([
    'settings_site',
    'settings_navigation',
    'settings_footer',
  ]);

  return {
    createClient,
    getCredentials: getTenantSanityCredentialsMock,
    listWebhooks: vi
      .fn()
      .mockResolvedValue([{ id: 'hook1', url: REVALIDATE_WEBHOOK_URL }]),
    listDomains: vi.fn().mockResolvedValue([{ name: 'acme.example.com' }]),
    sleep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  getTenantSanityCredentialsMock.mockReset();
  getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
});

describe(verifyTenantSeededContent, () => {
  it('passes when content, webhook, and domain are all verified', async () => {
    const tenant = baseTenant();
    const { createClient, fetch } = createClientStubResolving([
      'settings_site',
      'settings_navigation',
      'settings_footer',
    ]);
    const listWebhooks = vi
      .fn()
      .mockResolvedValue([{ id: 'hook1', url: REVALIDATE_WEBHOOK_URL }]);
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: 'acme.example.com' }]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(
      tenant,
      env,
      baseDeps({ createClient, listWebhooks, listDomains, sleep }),
    );

    expect(fetch).toHaveBeenCalledWith('*[_type in $types]._type', {
      types: ['settings_site', 'settings_navigation', 'settings_footer'],
    });
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "settings_navigation"][0].items[]{ "resolved": defined(link->_id) }',
    );
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "page_home"][0]{ headingBlock, seo }',
    );
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj123',
        dataset: 'production',
        token: 'sk-read',
        useCdn: false,
      }),
    );
    expect(listWebhooks).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
    expect(listDomains).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      projectId: 'prj_web',
    });
    expect(sleep).not.toHaveBeenCalled();
  });

  it('fails the run when a required singleton is absent', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving([
      'settings_navigation',
      'settings_footer',
    ]);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(/missing required starter document\(s\): settings_site/);
  });

  it('fails the run when the dataset has none of the required singletons', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving([]);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(
      /missing required starter document\(s\): settings_site, settings_navigation, settings_footer/,
    );
  });

  it('fails the run when a seeded navigation item has no resolvable link reference', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      VALID_HOME_PAGE,
      [{ resolved: false }],
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(
      /"settings_navigation" has 1 item\(s\) with no resolvable "link" reference/,
    );
  });

  it('fails the run and counts every unresolved item when navigation mixes resolved and unresolved items', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      VALID_HOME_PAGE,
      [{ resolved: true }, { resolved: false }, { resolved: false }],
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(
      /"settings_navigation" has 2 item\(s\) with no resolvable "link" reference/,
    );
  });

  it('does not throw when settings_navigation has no items field (GROQ evaluates items[] to null, not [])', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      VALID_HOME_PAGE,
      null,
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).resolves.toBeUndefined();
  });

  it('fails the run when the dataset has no page_home document', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      null,
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(/dataset has no "page_home" document/);
  });

  it('fails the run when the seeded page_home has no headingBlock.heading', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      { headingBlock: null, seo: VALID_HOME_PAGE.seo },
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(/missing a non-empty headingBlock\.heading/);
  });

  it('fails the run when the seeded page_home has no seo.metaTitle', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      { headingBlock: VALID_HOME_PAGE.headingBlock, seo: null },
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(/missing a non-empty seo\.metaTitle/);
  });

  it('fails the run when the seeded page_home has a seo.metaTitle shorter than the 30 character schema minimum', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      { headingBlock: VALID_HOME_PAGE.headingBlock, seo: { metaTitle: 'x' } },
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(
      /has a seo\.metaTitle of 1 characters, outside the 30-60 bound/,
    );
  });

  it('fails the run when the seeded page_home has a seo.metaTitle longer than the 60 character schema maximum', async () => {
    const tenant = baseTenant();
    const { createClient } = createClientStubResolving(
      ['settings_site', 'settings_navigation', 'settings_footer'],
      {
        headingBlock: VALID_HOME_PAGE.headingBlock,
        seo: { metaTitle: 'x'.repeat(61) },
      },
    );

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(
      /has a seo\.metaTitle of 61 characters, outside the 30-60 bound/,
    );
  });

  it('throws when the tenant has no persisted Sanity read token yet', async () => {
    const tenant = baseTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);
    const createClient = vi.fn();

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient })),
    ).rejects.toThrow(/has no persisted Sanity read token yet/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('retries a transient permission-denied content read once and passes once it succeeds', async () => {
    const tenant = baseTenant();
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(grantError())
      .mockResolvedValueOnce([
        'settings_site',
        'settings_navigation',
        'settings_footer',
      ])
      .mockResolvedValueOnce(VALID_NAVIGATION_ITEMS)
      .mockResolvedValueOnce(VALID_HOME_PAGE);
    const { createClient } = createClientStub(fetch);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(
      tenant,
      env,
      baseDeps({ createClient, sleep }),
    );

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied content read and fails with a token-specific message, not a missing-content one', async () => {
    const tenant = baseTenant();
    const fetch = vi.fn().mockRejectedValue(grantError());
    const { createClient } = createClientStub(fetch);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ createClient, sleep })),
    ).rejects.toThrow(/persisted Sanity read token failed against its dataset/);

    expect(fetch.mock.calls.length).toBeGreaterThan(1);
  });

  it('fails the run when no webhook targets the revalidate URL on the tenant project', async () => {
    const tenant = baseTenant();
    const listWebhooks = vi
      .fn()
      .mockResolvedValue([
        { id: 'hook0', url: 'https://other.example.com/api/revalidate' },
      ]);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ listWebhooks })),
    ).rejects.toThrow(
      /has no revalidate webhook targeting "https:\/\/example\.com\/api\/revalidate"/,
    );
  });

  it('retries a transient permission-denied webhook read once and passes once it succeeds', async () => {
    const tenant = baseTenant();
    const listWebhooks = vi
      .fn()
      .mockRejectedValueOnce(grantError())
      .mockResolvedValueOnce([{ id: 'hook1', url: REVALIDATE_WEBHOOK_URL }]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(
      tenant,
      env,
      baseDeps({ listWebhooks, sleep }),
    );

    expect(listWebhooks).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied webhook read and fails with a webhook-specific message', async () => {
    const tenant = baseTenant();
    const listWebhooks = vi.fn().mockRejectedValue(grantError());
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ listWebhooks, sleep })),
    ).rejects.toThrow(
      /revalidate webhook check against its Sanity project failed/,
    );

    expect(listWebhooks.mock.calls.length).toBeGreaterThan(1);
  });

  it('fails the run when the tenant domain is not mapped on the shared Vercel project', async () => {
    const tenant = baseTenant();
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: 'someone-else.example.com' }]);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ listDomains })),
    ).rejects.toThrow(
      /domain "acme\.example\.com" is not mapped on the shared Vercel project/,
    );
  });

  it('retries a transient permission-denied domain read once and passes once it succeeds', async () => {
    const tenant = baseTenant();
    const listDomains = vi
      .fn()
      .mockRejectedValueOnce(grantError())
      .mockResolvedValueOnce([{ name: 'acme.example.com' }]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    await verifyTenantSeededContent(
      tenant,
      env,
      baseDeps({ listDomains, sleep }),
    );

    expect(listDomains).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied domain read and fails with a domain-specific message', async () => {
    const tenant = baseTenant();
    const listDomains = vi.fn().mockRejectedValue(grantError());
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      verifyTenantSeededContent(tenant, env, baseDeps({ listDomains, sleep })),
    ).rejects.toThrow(
      /domain mapping check against the shared Vercel project failed/,
    );

    expect(listDomains.mock.calls.length).toBeGreaterThan(1);
  });
});
