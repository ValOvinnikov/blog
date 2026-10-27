import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import { getTenantSanityCredentials } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
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
  MOCK_CURRENT_WEBHOOK,
  MOCK_OTHER_WEBHOOK,
} from '@worker/testing/webhook/fixtures';
import type { Mock } from 'vitest';

import {
  verifyTenantSeededContent,
  type TVerifyTenantSeededContentDeps,
} from './verify-seeded-content';

faker.seed(7008);

vi.mock('@blog/db/queries/tenants');

const { sanityManagementToken, vercelToken, vercelTeamId, vercelWebProjectId } =
  MOCK_PROVISION_ENV;

const MOCK_CREDENTIALS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  dataset: MOCK_SANITY_DATASET,
  token: MOCK_SANITY_READ_TOKEN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
  defaultLocale: LOCALE_ISO_CODES.EN,
};
const MOCK_VALID_HOME_PAGE = {
  headingBlock: { heading: faker.lorem.words(3) },
  seo: { metaTitle: faker.string.alpha(40) },
};
const MOCK_OTHER_DOMAIN = faker.internet.domainName();
const REQUIRED_TYPES = [
  'settings_site',
  'settings_navigation',
  'settings_footer',
];
const MOCK_VALID_NAVIGATION_ITEMS = [{ resolved: true }];

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockProvisionedTenant({
    sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    seededAt: MOCK_NOW,
    ...overrides,
  });
}

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

function createClientStubResolving(
  foundTypes: string[],
  homePage: unknown = MOCK_VALID_HOME_PAGE,
  navigationItems: unknown = MOCK_VALID_NAVIGATION_ITEMS,
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
    getCredentials: getTenantSanityCredentials,
    listWebhooks: vi.fn().mockResolvedValue([MOCK_CURRENT_WEBHOOK]),
    listDomains: vi.fn().mockResolvedValue([{ name: MOCK_TENANT_DOMAIN }]),
    sleep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function transientThenOk(okValue: unknown) {
  return vi
    .fn()
    .mockRejectedValueOnce(mockSanityGrantError())
    .mockResolvedValueOnce(okValue);
}

const MOCK_GRANT_DENIED_READS = [
  {
    read: 'content',
    transient: () => {
      const reader = vi
        .fn()
        .mockRejectedValueOnce(mockSanityGrantError())
        .mockResolvedValueOnce(REQUIRED_TYPES)
        .mockResolvedValueOnce(MOCK_VALID_NAVIGATION_ITEMS)
        .mockResolvedValueOnce(MOCK_VALID_HOME_PAGE);
      return {
        reader,
        deps: { createClient: createClientStub(reader).createClient },
      };
    },
    transientCalls: 4,
    persistent: () => {
      const reader = vi.fn().mockRejectedValue(mockSanityGrantError());
      return {
        reader,
        deps: { createClient: createClientStub(reader).createClient },
      };
    },
    failure: /persisted Sanity read token failed against its dataset/,
  },
  {
    read: 'webhook',
    transient: () => {
      const reader = transientThenOk([MOCK_CURRENT_WEBHOOK]);
      return { reader, deps: { listWebhooks: reader } };
    },
    transientCalls: 2,
    persistent: () => {
      const reader = vi.fn().mockRejectedValue(mockSanityGrantError());
      return { reader, deps: { listWebhooks: reader } };
    },
    failure: /revalidate webhook check against its Sanity project failed/,
  },
  {
    read: 'domain',
    transient: () => {
      const reader = transientThenOk([{ name: MOCK_TENANT_DOMAIN }]);
      return { reader, deps: { listDomains: reader } };
    },
    transientCalls: 2,
    persistent: () => {
      const reader = vi.fn().mockRejectedValue(mockSanityGrantError());
      return { reader, deps: { listDomains: reader } };
    },
    failure: /domain mapping check against the shared Vercel project failed/,
  },
];

describe(verifyTenantSeededContent, () => {
  let tenant: TTenant;
  let sleep: Mock<(ms: number) => Promise<void>>;

  function verify(overrides: Partial<TVerifyTenantSeededContentDeps> = {}) {
    return verifyTenantSeededContent(
      tenant,
      MOCK_PROVISION_ENV,
      baseDeps({ sleep, ...overrides }),
    );
  }

  beforeEach(() => {
    tenant = baseTenant();
    sleep = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(MOCK_CREDENTIALS);
  });

  it('passes when content, webhook, and domain are all verified', async () => {
    const { createClient, fetch } = createClientStubResolving(REQUIRED_TYPES);
    const listWebhooks = vi.fn().mockResolvedValue([MOCK_CURRENT_WEBHOOK]);
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: MOCK_TENANT_DOMAIN }]);

    await verify({ createClient, listWebhooks, listDomains });

    const [clientOptions] = vi.mocked(createClient).mock.lastCall ?? [];
    expect(fetch).toHaveBeenCalledWith('*[_type in $types]._type', {
      types: REQUIRED_TYPES,
    });
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "settings_navigation"][0].items[]{ "resolved": defined(link->_id) }',
    );
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == "page_home"][0]{ headingBlock, seo }',
    );
    expect(clientOptions?.projectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(clientOptions?.dataset).toBe(MOCK_SANITY_DATASET);
    expect(clientOptions?.token).toBe(MOCK_SANITY_READ_TOKEN);
    expect(clientOptions?.useCdn).toBe(false);
    expect(listWebhooks).toHaveBeenCalledWith({
      token: sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
    });
    expect(listDomains).toHaveBeenCalledWith({
      token: vercelToken,
      teamId: vercelTeamId,
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

      await expect(verify({ createClient })).rejects.toThrow(expected);
    },
  );

  it.each([
    [[{ resolved: false }], 1],
    [[{ resolved: true }, { resolved: false }, { resolved: false }], 2],
  ])(
    'fails the run counting navigation items with no link reference (%j)',
    async (navigationItems, unresolvedCount) => {
      const { createClient } = createClientStubResolving(
        REQUIRED_TYPES,
        MOCK_VALID_HOME_PAGE,
        navigationItems,
      );

      await expect(verify({ createClient })).rejects.toThrow(
        `"settings_navigation" has ${unresolvedCount} item(s) with no resolvable "link" reference`,
      );
    },
  );

  it('does not throw when settings_navigation has no items field', async () => {
    const { createClient } = createClientStubResolving(
      REQUIRED_TYPES,
      MOCK_VALID_HOME_PAGE,
      null,
    );

    await expect(verify({ createClient })).resolves.toBeUndefined();
  });

  it.each([
    [
      'there is no page_home document',
      null,
      /dataset has no "page_home" document/,
    ],
    [
      'page_home has no headingBlock.heading',
      { headingBlock: null, seo: MOCK_VALID_HOME_PAGE.seo },
      /missing a non-empty headingBlock\.heading/,
    ],
    [
      'page_home has no seo.metaTitle',
      { headingBlock: MOCK_VALID_HOME_PAGE.headingBlock, seo: null },
      /missing a non-empty seo\.metaTitle/,
    ],
    [
      'the seo.metaTitle is under the 30 character minimum',
      {
        headingBlock: MOCK_VALID_HOME_PAGE.headingBlock,
        seo: { metaTitle: 'x' },
      },
      /has a seo\.metaTitle of 1 characters, outside the 30-60 bound/,
    ],
    [
      'the seo.metaTitle is over the 60 character maximum',
      {
        headingBlock: MOCK_VALID_HOME_PAGE.headingBlock,
        seo: { metaTitle: 'x'.repeat(61) },
      },
      /has a seo\.metaTitle of 61 characters, outside the 30-60 bound/,
    ],
  ])('fails the run when %s', async (_label, homePage, expected) => {
    const { createClient } = createClientStubResolving(
      REQUIRED_TYPES,
      homePage,
    );

    await expect(verify({ createClient })).rejects.toThrow(expected);
  });

  it('throws when the tenant has no persisted Sanity read token yet', async () => {
    vi.mocked(getTenantSanityCredentials).mockResolvedValue(undefined);
    const createClient = vi.fn();

    await expect(verify({ createClient })).rejects.toThrow(
      /has no persisted Sanity read token yet/,
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it.each(MOCK_GRANT_DENIED_READS)(
    'retries a transient permission-denied $read read once and passes',
    async ({ transient, transientCalls }) => {
      const { reader, deps } = transient();

      await verify(deps);

      expect(reader).toHaveBeenCalledTimes(transientCalls);
      expect(sleep).toHaveBeenCalledTimes(1);
    },
  );

  it.each(MOCK_GRANT_DENIED_READS)(
    'fails with a $read-specific message once permission-denied retries run out',
    async ({ persistent, failure }) => {
      const { reader, deps } = persistent();

      await expect(verify(deps)).rejects.toThrow(failure);

      expect(reader.mock.calls.length).toBeGreaterThan(1);
    },
  );

  it('fails the run when no webhook targets the revalidate URL', async () => {
    const listWebhooks = vi.fn().mockResolvedValue([MOCK_OTHER_WEBHOOK]);

    await expect(verify({ listWebhooks })).rejects.toThrow(
      `has no revalidate webhook targeting "${MOCK_REVALIDATE_WEBHOOK_URL}"`,
    );
  });

  it('fails the run when the tenant domain is not mapped on the Vercel project', async () => {
    const listDomains = vi
      .fn()
      .mockResolvedValue([{ name: MOCK_OTHER_DOMAIN }]);

    await expect(verify({ listDomains })).rejects.toThrow(
      `domain "${MOCK_TENANT_DOMAIN}" is not mapped on the shared Vercel project`,
    );
  });
});
