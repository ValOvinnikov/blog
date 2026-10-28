import {
  ACTION_OUTCOME,
  ERROR_CODE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult } from '@blog/utils';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { mockOwnerContext } from '@platform/testing/custom-domain/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { connectCustomDomainAction } from './connect-custom-domain-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/provisioning/enqueue-provisioning');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const { tenantDomains, customDomainClaims } = queries;

const MOCK_WEB_HOST = 'web.example.net';
const MOCK_PLATFORM_HOST = 'admin.example.net';
const MOCK_OTHER_CUSTOM_DOMAIN = 'legacy.example.dev';
const MOCK_INPUT = { domain: ` ${MOCK_CUSTOM_DOMAIN.toUpperCase()} ` };

const MOCK_GROWTH_OWNER = { plan: TENANT_PLAN.GROWTH };

const connect = (input = MOCK_INPUT) =>
  connectCustomDomainAction(MOCK_TENANT_ID, input);

const asTenant = (overrides: Partial<TTenant>) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(
      mockOwnerContext({ ...MOCK_GROWTH_OWNER, ...overrides }),
    );

describe(connectCustomDomainAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockOwnerContext(MOCK_GROWTH_OWNER));
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    mockedEnv.WEB_APP_URL = `https://${MOCK_WEB_HOST}`;
    mockedEnv.PLATFORM_APP_BASE_URL = `https://${MOCK_PLATFORM_HOST}`;
    vi.mocked(tenantDomains.isDomainHeldByAnyTenant)
      .mockReset()
      .mockResolvedValue(false);
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue([]);
    vi.mocked(customDomainClaims.createCustomDomainClaim)
      .mockReset()
      .mockResolvedValue(okResult({} as never));
    vi.mocked(enqueueWorkerRequest).mockReset();
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(connect()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('records a claim for the normalised domain without contacting the worker', async () => {
    const result = await connect();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(customDomainClaims.createCustomDomainClaim).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('reports input that is not a full domain without saving it', async () => {
    const result = await connect({
      domain: 'not a domain',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID },
      },
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('reports a host under the platform root domain', async () => {
    const result = await connect({
      domain: `blog.${MOCK_TENANT_ROOT_DOMAIN}`,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS },
      },
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it.each([
    ['the bare root domain', MOCK_TENANT_ROOT_DOMAIN],
    ['the web app host', MOCK_WEB_HOST],
    ['the platform app host', MOCK_PLATFORM_HOST],
  ])('reports %s as a platform address', async (_name, domain) => {
    const result = await connect({ domain });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS },
      },
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('fails closed with a logged server error when the root domain is unset', async () => {
    delete mockedEnv.TENANT_ROOT_DOMAIN;

    const result = await connect();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.ROOT_DOMAIN_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it.each([
    ['WEB_APP_URL', ['WEB_APP_URL']],
    ['PLATFORM_APP_BASE_URL', ['PLATFORM_APP_BASE_URL']],
  ] as const)(
    'fails closed with a logged server error when %s is unset',
    async (name, missing) => {
      delete mockedEnv[name];

      const result = await connectCustomDomainAction(
        MOCK_TENANT_ID,
        MOCK_INPUT,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(logger.error).toHaveBeenCalledWith(
        CUSTOM_DOMAIN_LOG.APP_URL_MISSING,
        { tenantId: MOCK_TENANT_ID, missing },
      );
      expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
      expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    },
  );

  it('refuses a tenant whose main address is already a custom domain', async () => {
    asTenant({ primaryDomain: MOCK_OTHER_CUSTOM_DOMAIN });

    const result = await connect();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('refuses a member who is not the owner', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    await expect(connect()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('reports a domain another tenant already holds', async () => {
    vi.mocked(tenantDomains.isDomainHeldByAnyTenant).mockResolvedValue(true);

    const result = await connect();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('refuses a site that already has a claim waiting', async () => {
    vi.mocked(customDomainClaims.createCustomDomainClaim).mockResolvedValue(
      errorResult(ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS),
    );

    const result = await connect();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.CLAIM_PENDING,
    });
  });

  it.each([
    [
      'a Free tenant',
      { plan: TENANT_PLAN.FREE },
      CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN,
    ],
    [
      'an archived tenant',
      { deprovisionedAt: new Date() },
      CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    ],
    [
      'a tenant without a Sanity project',
      { sanityProjectId: null },
      CUSTOM_DOMAIN_REFUSAL.NOT_PROVISIONED,
    ],
  ])('refuses %s', async (_name, overrides, reason) => {
    asTenant(overrides);

    const result = await connect();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('refuses a tenant that already has a custom domain', async () => {
    vi.mocked(tenantDomains.listTenantDomains).mockResolvedValue([
      { domain: 'other.example.dev' } as never,
    ]);

    const result = await connect();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });
    expect(customDomainClaims.createCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('logs and reports a server error when the claim cannot be written', async () => {
    vi.mocked(customDomainClaims.createCustomDomainClaim).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await connect();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.CONNECT_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        error: ERROR_CODE.DB_NOT_FOUND,
      },
    );
  });
});
