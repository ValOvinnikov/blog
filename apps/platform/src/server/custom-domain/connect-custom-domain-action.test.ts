import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult } from '@blog/utils';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { connectCustomDomainAction } from './connect-custom-domain-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueWorkerRequest: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: {
      isDomainHeldByAnyTenant: vi.fn(),
      listTenantDomains: vi.fn(),
      addTenantDomain: vi.fn(),
      removeTenantDomain: vi.fn(),
    },
  },
}));

const { tenantDomains } = queries;
const envMock: Partial<Record<keyof typeof env, string>> = env;

const MOCK_WEB_HOST = 'web.example.net';
const MOCK_PLATFORM_HOST = 'admin.example.net';
const MOCK_OTHER_CUSTOM_DOMAIN = 'legacy.example.dev';
const MOCK_INPUT = { domain: ` ${MOCK_CUSTOM_DOMAIN.toUpperCase()} ` };

const asMember = (overrides: Partial<TTenant> = {}) =>
  vi.mocked(requireTenantMembership).mockResolvedValueOnce({
    tenant: mockReadyTenant({
      id: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
      primaryDomain: MOCK_TENANT_DOMAIN,
      ...overrides,
    }),
    membership: mockMembership(),
  });

describe(connectCustomDomainAction, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    envMock.WEB_APP_URL = `https://${MOCK_WEB_HOST}`;
    envMock.PLATFORM_APP_BASE_URL = `https://${MOCK_PLATFORM_HOST}`;
    vi.mocked(tenantDomains.isDomainHeldByAnyTenant)
      .mockReset()
      .mockResolvedValue(false);
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue([]);
    vi.mocked(tenantDomains.addTenantDomain)
      .mockReset()
      .mockResolvedValue(okResult({} as never));
    vi.mocked(tenantDomains.removeTenantDomain)
      .mockReset()
      .mockResolvedValue(true);
    vi.mocked(enqueueWorkerRequest)
      .mockReset()
      .mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(
      connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('connects the normalised domain and audits the request', async () => {
    asMember();

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenantDomains.addTenantDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(enqueueWorkerRequest).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_PATH.CONNECT,
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        details: { customDomainConnectRequested: MOCK_CUSTOM_DOMAIN },
      }),
    );
  });

  it('reports input that is not a full domain without saving it', async () => {
    asMember();

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, {
      domain: 'not a domain',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID },
      },
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('reports a host under the platform root domain', async () => {
    asMember();

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, {
      domain: `blog.${MOCK_TENANT_ROOT_DOMAIN}`,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS },
      },
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it.each([
    ['the bare root domain', MOCK_TENANT_ROOT_DOMAIN],
    ['the web app host', MOCK_WEB_HOST],
    ['the platform app host', MOCK_PLATFORM_HOST],
  ])('reports %s as a platform address', async (_name, domain) => {
    asMember();

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, { domain });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS },
      },
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('fails closed with a logged server error when the root domain is unset', async () => {
    asMember();
    delete envMock.TENANT_ROOT_DOMAIN;

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.ROOT_DOMAIN_MISSING,
      { tenantId: MOCK_TENANT_ID },
    );
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it.each([
    ['WEB_APP_URL', ['WEB_APP_URL']],
    ['PLATFORM_APP_BASE_URL', ['PLATFORM_APP_BASE_URL']],
  ] as const)(
    'fails closed with a logged server error when %s is unset',
    async (name, missing) => {
      asMember();
      delete envMock[name];

      const result = await connectCustomDomainAction(
        MOCK_TENANT_ID,
        MOCK_INPUT,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(logger.error).toHaveBeenCalledWith(
        CUSTOM_DOMAIN_LOG.APP_URL_MISSING,
        { tenantId: MOCK_TENANT_ID, missing },
      );
      expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
      expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    },
  );

  it('refuses a tenant whose main address is already a custom domain', async () => {
    asMember({ primaryDomain: MOCK_OTHER_CUSTOM_DOMAIN });

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('refuses a member who is not the owner', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    await expect(
      connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('reports a domain another tenant already holds', async () => {
    asMember();
    vi.mocked(tenantDomains.isDomainHeldByAnyTenant).mockResolvedValue(true);

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it('reports a domain claimed between the check and the write as taken', async () => {
    asMember();
    vi.mocked(tenantDomains.addTenantDomain).mockResolvedValue(
      errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN),
    );

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
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
    asMember(overrides);

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('refuses a tenant that already has a custom domain', async () => {
    asMember();
    vi.mocked(tenantDomains.listTenantDomains).mockResolvedValue([
      { domain: 'other.example.dev' } as never,
    ]);

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED,
    });
    expect(tenantDomains.addTenantDomain).not.toHaveBeenCalled();
  });

  it.each([
    ['a rejected response', HTTP_STATUS.INTERNAL_SERVER_ERROR],
    ['no response', null],
  ])(
    'removes the saved domain and reports a server error on %s from the worker',
    async (_name, status) => {
      asMember();
      vi.mocked(enqueueWorkerRequest).mockResolvedValue(status);

      const result = await connectCustomDomainAction(
        MOCK_TENANT_ID,
        MOCK_INPUT,
      );

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(tenantDomains.removeTenantDomain).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_CUSTOM_DOMAIN,
      );
      expect(logger.error).toHaveBeenCalledWith(
        CUSTOM_DOMAIN_LOG.CONNECT_ENQUEUE_REJECTED,
        expect.objectContaining({ responseStatus: status }),
      );
      expect(recordAuditEvent).not.toHaveBeenCalled();
    },
  );

  it('reports a server error without contacting the worker when the write fails', async () => {
    asMember();
    vi.mocked(tenantDomains.addTenantDomain).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await connectCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
