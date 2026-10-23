import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  MOCK_PROVISION_ENV,
  MOCK_REVALIDATE_WEBHOOK_URL,
} from '@worker/testing/provision-env/fake-provision-env';
import { mockSanityGrantError } from '@worker/testing/sanity-client-error/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_READ_TOKEN,
  MOCK_TENANT_DOMAIN,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import {
  MOCK_OTHER_WEBHOOK_ID,
  MOCK_OTHER_WEBHOOK_URL,
  MOCK_WEBHOOK_ID,
} from '@worker/testing/webhook/fixtures';
import type { Mock } from 'vitest';

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

const { sanityManagementToken, vercelToken, vercelWebProjectId } =
  MOCK_PROVISION_ENV;

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: new Date(),
    ...overrides,
  });
}

const baseCredentials = {
  projectId: MOCK_SANITY_PROJECT_ID,
  dataset: MOCK_SANITY_DATASET,
  token: MOCK_SANITY_READ_TOKEN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
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

const REQUIRED_TYPES = [
  'settings_site',
  'settings_navigation',
  'settings_footer',
];
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

function baseDeps(
  overrides: Partial<TVerifyTenantSeededContentDeps> = {},
): TVerifyTenantSeededContentDeps {
  const { createClient } = createClientStubResolving(REQUIRED_TYPES);

  return {
    createClient,
    getCredentials: getTenantSanityCredentialsMock,
    listWebhooks: vi
      .fn()
      .mockResolvedValue([
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]),
    listDomains: vi.fn().mockResolvedValue([{ name: MOCK_TENANT_DOMAIN }]),
    sleep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  getTenantSanityCredentialsMock.mockReset();
  getTenantSanityCredentialsMock.mockResolvedValue(baseCredentials);
});

describe(verifyTenantSeededContent, () => {
  let tenant: TTenant;
  let sleep: Mock<(ms: number) => Promise<void>>;

  beforeEach(() => {
    tenant = baseTenant();
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  it('passes when content, webhook, and domain are all verified', async () => {
    const { createClient, fetch } = createClientStubResolving(REQUIRED_TYPES);
    const listWebhooks = vi
      .fn()
      .mockResolvedValue([
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]);
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: MOCK_TENANT_DOMAIN }]);

    await verifyTenantSeededContent(
      tenant,
      MOCK_PROVISION_ENV,
      baseDeps({ createClient, listWebhooks, listDomains, sleep }),
    );

    expect(fetch).toHaveBeenCalledWith('*[_type in $types]._type', {
      types: REQUIRED_TYPES,
    });
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "settings_navigation"][0].items[]{ "resolved": defined(link->_id) }',
    );
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "page_home"][0]{ headingBlock, seo }',
    );
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: MOCK_SANITY_PROJECT_ID,
        dataset: MOCK_SANITY_DATASET,
        token: MOCK_SANITY_READ_TOKEN,
        useCdn: false,
      }),
    );
    expect(listWebhooks).toHaveBeenCalledWith({
      token: sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
    });
    expect(listDomains).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: undefined,
      projectId: vercelWebProjectId,
    });
    expect(sleep).not.toHaveBeenCalled();
  });

  it.each([
    [
      'one is absent',
      ['settings_navigation', 'settings_footer'],
      /missing required starter document\(s\): settings_site/,
    ],
    [
      'none exist',
      [],
      /missing required starter document\(s\): settings_site, settings_navigation, settings_footer/,
    ],
  ])(
    'fails the run naming the missing singletons when %s',
    async (_label, foundTypes, expected) => {
      const { createClient } = createClientStubResolving(foundTypes);

      await expect(
        verifyTenantSeededContent(
          tenant,
          MOCK_PROVISION_ENV,
          baseDeps({ createClient }),
        ),
      ).rejects.toThrow(expected);
    },
  );

  it.each([
    [[{ resolved: false }], 1],
    [[{ resolved: true }, { resolved: false }, { resolved: false }], 2],
  ])(
    'fails the run counting the navigation items with no link reference (%j)',
    async (navigationItems, unresolvedCount) => {
      const { createClient } = createClientStubResolving(
        REQUIRED_TYPES,
        VALID_HOME_PAGE,
        navigationItems,
      );

      await expect(
        verifyTenantSeededContent(
          tenant,
          MOCK_PROVISION_ENV,
          baseDeps({ createClient }),
        ),
      ).rejects.toThrow(
        `"settings_navigation" has ${unresolvedCount} item(s) with no resolvable "link" reference`,
      );
    },
  );

  it('does not throw when settings_navigation has no items field (GROQ evaluates items[] to null, not [])', async () => {
    const { createClient } = createClientStubResolving(
      REQUIRED_TYPES,
      VALID_HOME_PAGE,
      null,
    );

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ createClient }),
      ),
    ).resolves.toBeUndefined();
  });

  it.each([
    [
      'there is no page_home document',
      null,
      /dataset has no "page_home" document/,
    ],
    [
      'page_home has no headingBlock.heading',
      { headingBlock: null, seo: VALID_HOME_PAGE.seo },
      /missing a non-empty headingBlock\.heading/,
    ],
    [
      'page_home has no seo.metaTitle',
      { headingBlock: VALID_HOME_PAGE.headingBlock, seo: null },
      /missing a non-empty seo\.metaTitle/,
    ],
    [
      'the seo.metaTitle is under the 30 character minimum',
      { headingBlock: VALID_HOME_PAGE.headingBlock, seo: { metaTitle: 'x' } },
      /has a seo\.metaTitle of 1 characters, outside the 30-60 bound/,
    ],
    [
      'the seo.metaTitle is over the 60 character maximum',
      {
        headingBlock: VALID_HOME_PAGE.headingBlock,
        seo: { metaTitle: 'x'.repeat(61) },
      },
      /has a seo\.metaTitle of 61 characters, outside the 30-60 bound/,
    ],
  ])('fails the run when %s', async (_label, homePage, expected) => {
    const { createClient } = createClientStubResolving(
      REQUIRED_TYPES,
      homePage,
    );

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ createClient }),
      ),
    ).rejects.toThrow(expected);
  });

  it('throws when the tenant has no persisted Sanity read token yet', async () => {
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);
    const createClient = vi.fn();

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ createClient }),
      ),
    ).rejects.toThrow(/has no persisted Sanity read token yet/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('retries a transient permission-denied content read once and passes once it succeeds', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(mockSanityGrantError())
      .mockResolvedValueOnce(REQUIRED_TYPES)
      .mockResolvedValueOnce(VALID_NAVIGATION_ITEMS)
      .mockResolvedValueOnce(VALID_HOME_PAGE);
    const { createClient } = createClientStub(fetch);

    await verifyTenantSeededContent(
      tenant,
      MOCK_PROVISION_ENV,
      baseDeps({ createClient, sleep }),
    );

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied content read and fails with a token-specific message, not a missing-content one', async () => {
    const fetch = vi.fn().mockRejectedValue(mockSanityGrantError());
    const { createClient } = createClientStub(fetch);

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ createClient, sleep }),
      ),
    ).rejects.toThrow(/persisted Sanity read token failed against its dataset/);

    expect(fetch.mock.calls.length).toBeGreaterThan(1);
  });

  it('fails the run when no webhook targets the revalidate URL on the tenant project', async () => {
    const listWebhooks = vi
      .fn()
      .mockResolvedValue([
        { id: MOCK_OTHER_WEBHOOK_ID, url: MOCK_OTHER_WEBHOOK_URL },
      ]);

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ listWebhooks }),
      ),
    ).rejects.toThrow(
      /has no revalidate webhook targeting "https:\/\/web\.example\.com\/api\/revalidate"/,
    );
  });

  it('retries a transient permission-denied webhook read once and passes once it succeeds', async () => {
    const listWebhooks = vi
      .fn()
      .mockRejectedValueOnce(mockSanityGrantError())
      .mockResolvedValueOnce([
        { id: MOCK_WEBHOOK_ID, url: MOCK_REVALIDATE_WEBHOOK_URL },
      ]);

    await verifyTenantSeededContent(
      tenant,
      MOCK_PROVISION_ENV,
      baseDeps({ listWebhooks, sleep }),
    );

    expect(listWebhooks).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied webhook read and fails with a webhook-specific message', async () => {
    const listWebhooks = vi.fn().mockRejectedValue(mockSanityGrantError());

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ listWebhooks, sleep }),
      ),
    ).rejects.toThrow(
      /revalidate webhook check against its Sanity project failed/,
    );

    expect(listWebhooks.mock.calls.length).toBeGreaterThan(1);
  });

  it('fails the run when the tenant domain is not mapped on the shared Vercel project', async () => {
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: 'someone-else.example.com' }]);

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ listDomains }),
      ),
    ).rejects.toThrow(
      /domain "acme\.example\.com" is not mapped on the shared Vercel project/,
    );
  });

  it('retries a transient permission-denied domain read once and passes once it succeeds', async () => {
    const listDomains = vi
      .fn()
      .mockRejectedValueOnce(mockSanityGrantError())
      .mockResolvedValueOnce([{ name: MOCK_TENANT_DOMAIN }]);

    await verifyTenantSeededContent(
      tenant,
      MOCK_PROVISION_ENV,
      baseDeps({ listDomains, sleep }),
    );

    expect(listDomains).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent permission-denied domain read and fails with a domain-specific message', async () => {
    const listDomains = vi.fn().mockRejectedValue(mockSanityGrantError());

    await expect(
      verifyTenantSeededContent(
        tenant,
        MOCK_PROVISION_ENV,
        baseDeps({ listDomains, sleep }),
      ),
    ).rejects.toThrow(
      /domain mapping check against the shared Vercel project failed/,
    );

    expect(listDomains.mock.calls.length).toBeGreaterThan(1);
  });
});
